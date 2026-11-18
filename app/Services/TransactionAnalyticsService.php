<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Computes all dashboard analytics from an already-fetched set of transactions.
 * No DB access here: the caller fetches once, this class only crunches numbers.
 *
 * Changes in this version (all existing response keys are kept):
 *  - Growth rates compare like with like: "this week so far" is measured against
 *    the same number of days of last week (same for months), instead of against
 *    the whole previous period. When there is nothing to compare with, the growth
 *    rate is null instead of 0.
 *  - Weekly daily averages divide by the days elapsed this week, not always 7.
 *  - Period ranges run to the END of today, so a transaction_date that carries a
 *    time of day is no longer dropped.
 *  - Previous month is found with subMonthNoOverflow() (subMonth() on the 31st
 *    lands in the wrong month).
 *  - Each transaction_date is parsed once instead of once per period.
 *  - New, additive fields: per-item stock value, sell-through, 30-day sales
 *    pace and days of stock left, plus a top-level stock_value.
 */
class TransactionAnalyticsService
{
    /** Window used for the "days of stock left" sales pace. */
    private const PACE_WINDOW_DAYS = 30;

    /**
     * @param  Collection  $transactions  All transactions for the user's items
     * @param  Carbon|null $now           Injectable for testing
     * @return array  Metrics (without "success" and "transaction", added by the controller)
     */
    public function analyze(Collection $transactions, ?Carbon $now = null): array
    {
        $now = $now ? $now->copy() : Carbon::now();

        // Parse every transaction_date once. map() keeps the collection keys,
        // so $dates[$key] always belongs to $transactions[$key].
        $dates = $transactions->map(fn($t) => Carbon::parse($t->transaction_date));

        // ---------- TOTAL METRICS ----------
        // Kept null-on-empty for stock_left to match the previous response exactly.
        $stockLeft = $transactions->isEmpty()
            ? null
            : $transactions->reduce(fn($c, $t) => $c + ($t->total_buy - $t->total_sell));

        $netProfit = $transactions->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $revenue   = $transactions->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);

        $totalSales       = $transactions->sum('total_sell');
        $avgProfitPerSale = $totalSales > 0 ? $netProfit / $totalSales : 0; // per unit sold

        $profitMargin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;

        // Money spent on ALL stock bought, including units still on the shelf.
        // ROI is therefore "profit on what sold / everything spent". To measure
        // only the cost of what was sold, divide by sum(total_sell * cost_price).
        $totalInvestment = $transactions->sum(fn($t) => $t->total_buy * $t->cost_price);
        $roi             = $totalInvestment > 0 ? ($netProfit / $totalInvestment) * 100 : 0;

        // ---------- ITEM PERFORMANCE ----------
        $itemPerformance = $this->itemPerformance($transactions, $dates, $now);

        // ---------- PERIOD SLICES (in memory) ----------
        $endOfToday = $now->copy()->endOfDay();

        // Week: Sunday to Saturday. dayOfWeek is 0 on Sunday, so Sunday = 1 day elapsed.
        $daysIntoWeek      = $now->dayOfWeek + 1;
        $weekStart         = $now->copy()->startOfWeek(Carbon::SUNDAY);
        $prevWeekStart     = $weekStart->copy()->subWeek();
        $prevWeekSameSpan  = $prevWeekStart->copy()->addDays($daysIntoWeek - 1)->endOfDay();

        $weekly     = $this->between($transactions, $dates, $weekStart, $endOfToday);
        $prevWeekly = $this->between($transactions, $dates, $prevWeekStart, $prevWeekSameSpan);

        // Month: day 1 to today, against day 1 to the same day of the previous month.
        $dayOfMonth        = $now->day;
        $monthStart        = $now->copy()->startOfMonth();
        $prevMonthStart    = $monthStart->copy()->subMonthNoOverflow();
        $prevMonthSameSpan = $prevMonthStart->copy()
            ->addDays(min($dayOfMonth, $prevMonthStart->daysInMonth) - 1)
            ->endOfDay();

        $monthly     = $this->between($transactions, $dates, $monthStart, $endOfToday);
        $prevMonthly = $this->between($transactions, $dates, $prevMonthStart, $prevMonthSameSpan);

        // ---------- WEEKLY ----------
        $weekProfit  = $weekly->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $weekRevenue = $weekly->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);
        $weekSales   = $weekly->sum('total_sell');
        $weekMargin  = $weekRevenue > 0 ? ($weekProfit / $weekRevenue) * 100 : 0;

        $prevWeekRevenue  = $prevWeekly->sum(fn($t) => $this->revenue($t));
        $weeklyGrowthRate = $this->growth($weekRevenue, $prevWeekRevenue);

        // ---------- MONTHLY ----------
        $monthProfit  = $monthly->reduce(fn($c, $t) => $c + $this->profit($t), 0.0);
        $monthRevenue = $monthly->reduce(fn($c, $t) => $c + $this->revenue($t), 0.0);
        $monthSales   = $monthly->sum('total_sell');
        $monthMargin  = $monthRevenue > 0 ? ($monthProfit / $monthRevenue) * 100 : 0;

        $prevMonthRevenue  = $prevMonthly->sum(fn($t) => $this->revenue($t));
        $monthlyGrowthRate = $this->growth($monthRevenue, $prevMonthRevenue);

        // ---------- INVENTORY INSIGHTS ----------
        // No ->values() on fast movers: original response preserved collection keys.
        // Fast movers are ranked by units sold. slow_moving_items are items that
        // have stock but have NEVER sold (use sell_through_percent / days_of_stock_left
        // on item_performance to find items that sell, but slowly).
        $fastMoving = $itemPerformance->where('sales_volume', '>', 0)
            ->sortByDesc('sales_volume')->take(3);
        $slowMoving = $itemPerformance->where('stock_left', '>', 0)
            ->where('sales_volume', 0);

        return [
            // TOTAL METRICS
            'total_sell'                   => $totalSales,
            'stock_left'                   => $stockLeft,
            'revenue'                      => round($revenue, 2),
            'total_net_profit'             => round($netProfit, 2), // gross profit: no expenses are tracked
            'average_profit_per_sale'      => round($avgProfitPerSale, 2),
            'profit_margin_percent'        => round($profitMargin, 2),
            'return_on_investment_percent' => round($roi, 2),
            'total_investment'             => round($totalInvestment, 2),

            // WEEKLY METRICS
            'this_week_revenue'            => round($weekRevenue, 2),
            'this_week_net_profit'         => round($weekProfit, 2),
            'weekly_sales_volume'          => $weekSales,
            'weekly_profit_margin_percent' => round($weekMargin, 2),
            'weekly_growth_rate_percent'   => $weeklyGrowthRate,
            'avg_daily_revenue'            => round($weekRevenue / $daysIntoWeek, 2),
            'avg_daily_profit'             => round($weekProfit / $daysIntoWeek, 2),
            'avg_daily_sales'              => round($weekSales / $daysIntoWeek, 2),

            // MONTHLY METRICS
            'this_month_revenue'            => round($monthRevenue, 2),
            'this_month_net_profit'         => round($monthProfit, 2),
            'monthly_sales_volume'          => $monthSales,
            'monthly_profit_margin_percent' => round($monthMargin, 2),
            'monthly_growth_rate_percent'   => $monthlyGrowthRate,
            'avg_monthly_daily_revenue'     => round($monthRevenue / $dayOfMonth, 2),
            'avg_monthly_daily_profit'      => round($monthProfit / $dayOfMonth, 2),
            'avg_monthly_daily_sales'       => round($monthSales / $dayOfMonth, 2),

            // ITEM INSIGHTS
            'item_performance'     => $itemPerformance,
            'top_performing_items' => $fastMoving,
            'slow_moving_items'    => $slowMoving->values(),

            // NEW (additive)
            'stock_value'          => round($itemPerformance->sum('stock_value'), 2),
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

    /** Percent change from $previous to $current, or null when there is nothing to compare with. */
    private function growth(float|int $current, float|int $previous): ?float
    {
        return $previous > 0
            ? round((($current - $previous) / $previous) * 100, 2)
            : null;
    }

    /** Inclusive date-range filter. $dates is keyed like $transactions. */
    private function between(Collection $transactions, Collection $dates, Carbon $from, Carbon $to): Collection
    {
        return $transactions->filter(fn($t, $key) => $dates[$key]->between($from, $to));
    }

    private function itemPerformance(Collection $transactions, Collection $dates, Carbon $now): Collection
    {
        $today       = $now->copy()->startOfDay();
        $windowStart = $today->copy()->subDays(self::PACE_WINDOW_DAYS - 1);
        $windowEnd   = $now->copy()->endOfDay();

        // groupBy(..., true) keeps the original keys so $dates[$key] still lines up.
        return $transactions->groupBy('item_id', true)->map(
            function ($group, $itemId) use ($dates, $today, $windowStart, $windowEnd) {
                $profit    = $group->sum(fn($t) => $this->profit($t));
                $revenue   = $group->sum(fn($t) => $this->revenue($t));
                $sold      = $group->sum('total_sell');
                $bought    = $group->sum('total_buy');
                $stockLeft = $group->sum(fn($t) => $t->total_buy - $t->total_sell);

                // Weighted average cost of everything bought, and what the stock on hand is worth at it.
                $avgCost    = $bought > 0 ? $group->sum(fn($t) => $t->total_buy * $t->cost_price) / $bought : 0;
                $stockValue = max($stockLeft, 0) * $avgCost;

                // Sales pace: units sold in the last 30 days, averaged over the days the
                // item has existed (at most 30), so a new item is not diluted by empty days.
                $soldRecently = $group
                    ->filter(fn($t, $key) => $dates[$key]->between($windowStart, $windowEnd))
                    ->sum('total_sell');

                $firstDate = $group->keys()->map(fn($key) => $dates[$key])
                    ->sortBy(fn($d) => $d->timestamp)->first();
                $daysActive = (int) round(($today->timestamp - $firstDate->copy()->startOfDay()->timestamp) / 86400) + 1;
                $paceDays   = max(1, min(self::PACE_WINDOW_DAYS, $daysActive));
                $dailyPace  = $soldRecently / $paceDays;

                return [
                    'item_id'       => $itemId,
                    'profit'        => round($profit, 2),
                    'revenue'       => round($revenue, 2),
                    'sales_volume'  => $sold,
                    'stock_left'    => $stockLeft,
                    'profit_margin' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : 0,

                    // NEW (additive)
                    'total_bought'         => $bought,
                    'avg_cost'             => round($avgCost, 2),
                    'stock_value'          => round($stockValue, 2),
                    'sell_through_percent' => $bought > 0 ? round(($sold / $bought) * 100, 2) : 0,
                    'sold_last_30_days'    => $soldRecently,
                    'avg_daily_sales_30d'  => round($dailyPace, 2),
                    'days_of_stock_left'   => ($dailyPace > 0 && $stockLeft > 0)
                        ? round($stockLeft / $dailyPace, 1)
                        : null,
                ];
            }
        )->sortByDesc('profit')->values();
    }
}
