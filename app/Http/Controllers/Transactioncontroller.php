<?php

namespace App\Http\Controllers;

use Exception;

use GrahamCampbell\ResultType\Success;
use Illuminate\Http\Request;

use App\Models\Item;

use App\Models\Transaction;

use Carbon\Carbon;


class Transactioncontroller extends Controller
{
    //
    public function getAllTransaction(Request $request){          
        $userId = $request->user()->id;          
        $itemIds = Item::where('user_id',$userId)->pluck("id");          
        $transaction = Transaction::whereIn('item_id', $itemIds)->get();          
        
        // TOTAL METRICS
        $netProfit = $transaction->reduce(function($carry,$t){             
            return $carry+(($t->total_sell*$t->selling_price) - ($t->total_sell*$t->cost_price));         
        });          
        
        $revenue = $transaction->reduce(function($carry, $t){             
            return $carry + ($t->total_sell * $t->selling_price);         
        }, 0.0);                             
        
        $stock_left = $transaction->reduce(function($carry, $t){             
            return $carry + ($t->total_buy- $t->total_sell);         
        });          
        
        $totalSales = $transaction->sum('total_sell');          
        $avgProfitPerSale = $totalSales > 0 ? $netProfit / $totalSales : 0;                  
        
        $totalCostOfGoodsSold = $transaction->sum(function($t) {             
            return $t->total_sell * $t->cost_price;         
        });         
        
        // NEW CALCULATIONS WITH EXISTING DATA
        $profitMargin = $revenue > 0 ? ($netProfit / $revenue) * 100 : 0;
        $totalInvestment = $transaction->sum(function($t) {
            return $t->total_buy * $t->cost_price;
        });
        $returnOnInvestment = $totalInvestment > 0 ? ($netProfit / $totalInvestment) * 100 : 0;
        
        // ITEM PERFORMANCE ANALYSIS
        $itemPerformance = $transaction->groupBy('item_id')->map(function($transactions, $itemId) {
            $itemProfit = $transactions->sum(function($t) {
                return ($t->total_sell * $t->selling_price) - ($t->total_sell * $t->cost_price);
            });
            $itemRevenue = $transactions->sum(function($t) {
                return $t->total_sell * $t->selling_price;
            });
            $itemSales = $transactions->sum('total_sell');
            $itemStock = $transactions->sum(function($t) {
                return $t->total_buy - $t->total_sell;
            });
            
            return [
                'item_id' => $itemId,
                'profit' => round($itemProfit, 2),
                'revenue' => round($itemRevenue, 2),
                'sales_volume' => $itemSales,
                'stock_left' => $itemStock,
                'profit_margin' => $itemRevenue > 0 ? round(($itemProfit / $itemRevenue) * 100, 2) : 0
            ];
        })->sortByDesc('profit')->values();
        
        // WEEKLY CALCULATIONS          
        $today = Carbon::today();          
        $startOfWeek = Carbon::now()->startOfWeek(Carbon::SUNDAY);          
        $weeklyTransactions = Transaction::whereIn('item_id', $itemIds)             
            ->whereBetween("transaction_date",[$startOfWeek, $today])->get();          
        
        $weekProfit = $weeklyTransactions->reduce(function ($carry, $trx) {                 
            return $carry + ($trx->total_sell * $trx->selling_price - $trx->total_sell * $trx->cost_price);             
        }, 0.0);          
        
        $weekRevenue = $weeklyTransactions->reduce(function ($carry, $trx) {             
            return $carry + ($trx->total_sell * $trx->selling_price);         
        }, 0.0);     
        
        // NEW WEEKLY CALCULATIONS
        $weeklySalesVolume = $weeklyTransactions->sum('total_sell');
        $weeklyProfitMargin = $weekRevenue > 0 ? ($weekProfit / $weekRevenue) * 100 : 0;
        $avgDailyRevenue = $weekRevenue / 7;
        $avgDailyProfit = $weekProfit / 7;
        $avgDailySales = $weeklySalesVolume / 7;
        
        // MONTHLY CALCULATIONS          
        $startOfMonth = Carbon::now()->startOfMonth();         
        $endOfToday = Carbon::today();          
        $monthlyTransactions = Transaction::whereIn('item_id', $itemIds)             
            ->whereBetween("transaction_date", [$startOfMonth, $endOfToday])             
            ->get();          
        
        $monthProfit = $monthlyTransactions->reduce(function ($carry, $trx) {             
            return $carry + ($trx->total_sell * $trx->selling_price - $trx->total_sell * $trx->cost_price);         
        }, 0.0);          
        
        $monthRevenue = $monthlyTransactions->reduce(function ($carry, $trx) {             
            return $carry + ($trx->total_sell * $trx->selling_price);         
        }, 0.0);       
        
        // NEW MONTHLY CALCULATIONS
        $monthlySalesVolume = $monthlyTransactions->sum('total_sell');
        $monthlyProfitMargin = $monthRevenue > 0 ? ($monthProfit / $monthRevenue) * 100 : 0;
        $daysInMonth = Carbon::now()->day;
        $avgMonthlyDailyRevenue = $monthRevenue / $daysInMonth;
        $avgMonthlyDailyProfit = $monthProfit / $daysInMonth;
        $avgMonthlyDailySales = $monthlySalesVolume / $daysInMonth;
        
        // GROWTH ANALYSIS (Previous Week/Month comparison)
        $previousWeekStart = Carbon::now()->subWeek()->startOfWeek(Carbon::SUNDAY);
        $previousWeekEnd = Carbon::now()->subWeek()->endOfWeek(Carbon::SATURDAY);
        $previousWeekTransactions = Transaction::whereIn('item_id', $itemIds)
            ->whereBetween("transaction_date", [$previousWeekStart, $previousWeekEnd])->get();
        
        $previousWeekRevenue = $previousWeekTransactions->sum(function($t) {
            return $t->total_sell * $t->selling_price;
        });
        
        $weeklyGrowthRate = $previousWeekRevenue > 0 ? 
            (($weekRevenue - $previousWeekRevenue) / $previousWeekRevenue) * 100 : 0;
        
        $previousMonthStart = Carbon::now()->subMonth()->startOfMonth();
        $previousMonthEnd = Carbon::now()->subMonth()->endOfMonth();
        $previousMonthTransactions = Transaction::whereIn('item_id', $itemIds)
            ->whereBetween("transaction_date", [$previousMonthStart, $previousMonthEnd])->get();
        
        $previousMonthRevenue = $previousMonthTransactions->sum(function($t) {
            return $t->total_sell * $t->selling_price;
        });
        
        $monthlyGrowthRate = $previousMonthRevenue > 0 ? 
            (($monthRevenue - $previousMonthRevenue) / $previousMonthRevenue) * 100 : 0;
        
        // INVENTORY INSIGHTS
        $fastMovingItems = $itemPerformance->where('sales_volume', '>', 0)
            ->sortByDesc('sales_volume')->take(3);
        $slowMovingItems = $itemPerformance->where('stock_left', '>', 0)
            ->where('sales_volume', 0);
        
        return response()->json([                 
            "success"=>true,                 
            "transaction"=>$transaction,                 
            
            // TOTAL METRICS
            "total_sell"=>$totalSales,                 
            "stock_left"=>$stock_left,                 
            "revenue"=>round($revenue,2),                 
            "total_net_profit"=>round($netProfit,2),                 
            "average_profit_per_sale"=>round($avgProfitPerSale,2),
            "profit_margin_percent"=>round($profitMargin,2),
            "return_on_investment_percent"=>round($returnOnInvestment,2),
            "total_investment"=>round($totalInvestment,2),
            
            // WEEKLY METRICS                  
            "this_week_revenue"=>round($weekRevenue,2),                 
            "this_week_net_profit" => round($weekProfit, 2),
            "weekly_sales_volume"=>$weeklySalesVolume,
            "weekly_profit_margin_percent"=>round($weeklyProfitMargin,2),
            "weekly_growth_rate_percent"=>round($weeklyGrowthRate,2),
            "avg_daily_revenue"=>round($avgDailyRevenue,2),
            "avg_daily_profit"=>round($avgDailyProfit,2),
            "avg_daily_sales"=>round($avgDailySales,2),
                    
            // MONTHLY METRICS                  
            "this_month_revenue"=> round($monthRevenue,2),                 
            "this_month_net_profit"=>round($monthProfit,2),
            "monthly_sales_volume"=>$monthlySalesVolume,
            "monthly_profit_margin_percent"=>round($monthlyProfitMargin,2),
            "monthly_growth_rate_percent"=>round($monthlyGrowthRate,2),
            "avg_monthly_daily_revenue"=>round($avgMonthlyDailyRevenue,2),
            "avg_monthly_daily_profit"=>round($avgMonthlyDailyProfit,2),
            "avg_monthly_daily_sales"=>round($avgMonthlyDailySales,2),
            
            // ITEM INSIGHTS
            "item_performance"=>$itemPerformance,
            "top_performing_items"=>$fastMovingItems,
            "slow_moving_items"=>$slowMovingItems->values(),


        ],200);      
    }

    public function add(Request $request){
        $userId = $request->user()->id;

        try {
            $validated = $request->validate([
                "item_id" => "required|integer",
                "total_buy" => "required|integer",
                "total_sell" => "required|integer",
                "cost_price" => "required|numeric",
                "selling_price" => "required|numeric",
                "transaction_date" => "required|date"
            ]);


            $item = Item::where('user_id', $userId)->where('id', $validated["item_id"])->firstOrFail();


            $validated['user_id'] = $userId;

            $transaction = Transaction::create($validated);

            return response()->json([
                "success" => true,
                "message" => "added successfully",
                "transaction" => $transaction
            ], 201);

        } catch (Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 400);
        }
    }

    public function get(Request $request, $id){
        $userId = $request->user()->id;
        if (! $userId) {
            return response()->json([
                "success" => false,
                "message" => "unauthenticated"
            ], 401);
        }

        try{
            $transaction = Transaction::where('id',$id)->firstOrFail();
            
            return response()->make(json_encode([
                "success"=>true,
                "transaction"=>$transaction
            ]),201);

        }catch(Exception $e){
            return response()->make(json_encode([
                "success"=>false,
                "message"=>"invalid id",
                "error"=>$e->getMessage()
            ]));
        }
    }

    
    public function update(Request $request, $id){
        $userId = $request->user()->id;

        if (! $userId) {
            return response()->json([
                "success" => false,
                "message" => "unauthenticated"
            ], 401);
        }

        try {
            $validated = $request->validate([
                "total_buy" => "integer",
                "total_sell" => "integer",
                "cost_price" => "numeric",
                "selling_price" => "numeric",
                "transaction_date" => "date"
            ]);


            $transaction = Transaction::where('id', $id)->firstOrFail();

            $transaction->update($validated);

            return response()->json([
                "success" => true,
                "message" => "updated successfully",
                "transaction" => $transaction
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                "success" => false,
                "error" => $e->getMessage()
            ], 400);
        }
    }
}
