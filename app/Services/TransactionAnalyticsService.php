<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Computes all dashboard analytics from an already-fetched set of transactions.
 * No DB access here: the caller fetches once, this class only crunches numbers.
 */
class TransactionAnalyticsService
{
    /**
     * @param  Collection  $transactions  All transactions for the user's items
     * @param  Carbon|null $now           Injectable for testing
     * @return array  Metrics in the exact key order the frontend expects
     *                (without "success" and "transaction", added by the controller)
     */
    public function analyze(Collection $transactions, ?Carbon $now = null): array
    {
        $now = $now ? $now->copy() : Carbon::now();

        // ---------- TOTAL METRICS ----------
        // Kept null-on-empty for stock_left to match the previous response exactly.
        $stockLeft = $transactions->isEmpty()
            ? null
            : $transactions->reduce(fn($c, $t) => $c + ($t->total_buy - $t->total_sell));

        $netProfit = $transactions->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $revenue   = $transactions->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);

        $totalSales       = $transactions->sum('total_sell');
        $avgProfitPerSale = $totalSales > 0 ? $netProfit / $totalSales : 0;
        $profitMargin     = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        $totalInvestment = $transactions->sum(fn($t) => $t->total_buy * $t->cost_price);
        $roi             = $totalInvestment > 0 ? ($netProfit / $totalInvestment) * 100 : 0;

        // ---------- ITEM PERFORMANCE ----------
        $itemPerformance = $this->itemPerformance($transactions);

        // ---------- PERIOD SLICES (in memory) ----------
        $today = $now->copy()->startOfDay();

        $weekStart = $now->copy()->startOfWeek(Carbon::SUNDAY);
        $weekly    = $this->between($transactions, $weekStart, $today);

        $monthStart = $now->copy()->startOfMonth();
        $monthly    = $this->between($transactions, $monthStart, $today);

        $prevWeekStart = $now->copy()->subWeek()->startOfWeek(Carbon::SUNDAY);
        $prevWeekEnd   = $now->copy()->subWeek()->endOfWeek(Carbon::SATURDAY);
        $prevWeekly    = $this->between($transactions, $prevWeekStart, $prevWeekEnd);

        $prevMonthStart = $now->copy()->subMonth()->startOfMonth();
        $prevMonthEnd   = $now->copy()->subMonth()->endOfMonth();
        $prevMonthly    = $this->between($transactions, $prevMonthStart, $prevMonthEnd);

        // ---------- WEEKLY ----------
        $weekProfit   = $weekly->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $weekRevenue  = $weekly->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);
        $weekSales    = $weekly->sum('total_sell');
        $weekMargin   = $weekRevenue > 0 ? ($weekProfit / $weekRevenue) * 100 : 0;

        $prevWeekRevenue  = $prevWeekly->sum(fn($t) => $this->revenue($t));
        $weeklyGrowthRate = $prevWeekRevenue > 0
            ? (($weekRevenue - $prevWeekRevenue) / $prevWeekRevenue) * 100 : 0;

        // ---------- MONTHLY ----------
        $monthProfit  = $monthly->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $monthRevenue = $monthly->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);
        $monthSales   = $monthly->sum('total_sell');
        $monthMargin  = $monthRevenue > 0 ? ($monthProfit / $monthRevenue) * 100 : 0;
        $dayOfMonth   = $now->day;

        $prevMonthRevenue  = $prevMonthly->sum(fn($t) => $this->revenue($t));
        $monthlyGrowthRate = $prevMonthRevenue > 0
            ? (($monthRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100 : 0;

        // ---------- INVENTORY INSIGHTS ----------
        // No ->values() on fast movers: original response preserved collection keys.
        $fastMoving = $itemPerformance->where('sales_volume', '>', 0)
            ->sortByDesc('sales_volume')->take(3);
        $slowMoving = $itemPerformance->where('stock_left', '>', 0)
            ->where('sales_volume', 0);

        return [
            // TOTAL METRICS
            'total_sell'                   => $totalSales,
            'stock_left'                   => $stockLeft,
            'revenue'                      => round($revenue, 2),
            'total_net_profit'             => round($netProfit, 2),
            'average_profit_per_sale'      => round($avgProfitPerSale, 2),
            'profit_margin_percent'        => round($profitMargin, 2),
            'return_on_investment_percent' => round($roi, 2),
            'total_investment'             => round($totalInvestment, 2),

            // WEEKLY METRICS
            'this_week_revenue'            => round($weekRevenue, 2),
            'this_week_net_profit'         => round($weekProfit, 2),
            'weekly_sales_volume'          => $weekSales,
            'weekly_profit_margin_percent' => round($weekMargin, 2),
            'weekly_growth_rate_percent'   => round($weeklyGrowthRate, 2),
            'avg_daily_revenue'            => round($weekRevenue / 7, 2),
            'avg_daily_profit'             => round($weekProfit / 7, 2),
            'avg_daily_sales'              => round($weekSales / 7, 2),

            // MONTHLY METRICS
            'this_month_revenue'            => round($monthRevenue, 2),
            'this_month_net_profit'         => round($monthProfit, 2),
            'monthly_sales_volume'          => $monthSales,
            'monthly_profit_margin_percent' => round($monthMargin, 2),
            'monthly_growth_rate_percent'   => round($monthlyGrowthRate, 2),
            'avg_monthly_daily_revenue'     => round($monthRevenue / $dayOfMonth, 2),
            'avg_monthly_daily_profit'      => round($monthProfit / $dayOfMonth, 2),
            'avg_monthly_daily_sales'       => round($monthSales / $dayOfMonth, 2),

            // ITEM INSIGHTS
            'item_performance'     => $itemPerformance,
            'top_performing_items' => $fastMoving,
            'slow_moving_items'    => $slowMoving->values(),
        ];
    }

    private function revenue($t): float|int
    {
        return $t->total_sell * $t->selling_price;
    }

    private function profit($t): float|int
    {
        return ($t->total_sell * $t->selling_price) - ($t->total_sell * $t->cost_price);
    }

    /** Inclusive date-range filter, same semantics as whereBetween. */
    private function between(Collection $transactions, Carbon $from, Carbon $to): Collection
    {
        return $transactions->filter(function ($t) use ($from, $to) {
            return Carbon::parse($t->transaction_date)->between($from, $to);
        });
    }

    private function itemPerformance(Collection $transactions): Collection
    {
        return $transactions->groupBy('item_id')->map(function ($group, $itemId) {
            $profit  = $group->sum(fn($t) => $this->profit($t));
            $revenue = $group->sum(fn($t) => $this->revenue($t));

            return [
                'item_id'       => $itemId,
                'profit'        => round($profit, 2),
                'revenue'       => round($revenue, 2),
                'sales_volume'  => $group->sum('total_sell'),
                'stock_left'    => $group->sum(fn($t) => $t->total_buy - $t->total_sell),
                'profit_margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0,
            ];
        })->sortByDesc('profit')->values();
    }
}
