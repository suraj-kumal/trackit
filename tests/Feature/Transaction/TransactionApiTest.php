<?php

namespace Tests\Feature;

use App\Models\Item;
use App\Models\Transaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Requires: UserFactory (default), ItemFactory and TransactionFactory
 * (database/factories), and `use HasFactory;` on the Transaction model.
 * Routes are assumed to live under /api/.
 */
class TransactionApiTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    // ---------- helpers ----------

    private function makeUserWithItem(): array
    {
        $user = User::factory()->create();
        $item = Item::factory()->create(['user_id' => $user->id]);

        return [$user, $item];
    }

    private function makeTransaction(Item $item, array $overrides = []): Transaction
    {
        return Transaction::factory()->create(array_merge([
            'item_id'          => $item->id,
            'total_buy'        => 10,
            'total_sell'       => 4,
            'cost_price'       => 5,
            'selling_price'    => 8,
            'transaction_date' => now()->toDateString(),
        ], $overrides));
    }

    private function validPayload(Item $item, array $overrides = []): array
    {
        return array_merge([
            'item_id'          => $item->id,
            'total_buy'        => 10,
            'total_sell'       => 4,
            'cost_price'       => 5,
            'selling_price'    => 8,
            'transaction_date' => now()->toDateString(),
        ], $overrides);
    }

    // ---------- authentication ----------

    public function test_all_endpoints_require_authentication(): void
    {
        $this->getJson('/api/transaction')->assertUnauthorized();
        $this->getJson('/api/transaction/1')->assertUnauthorized();
        $this->postJson('/api/transaction', [])->assertUnauthorized();
        $this->putJson('/api/transaction/1', [])->assertUnauthorized();
    }

    // ---------- GET /transaction (analytics) ----------

    public function test_index_returns_expected_json_structure(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        $this->makeTransaction($item);
        Sanctum::actingAs($user);

        $this->getJson('/api/transaction')
            ->assertOk()
            ->assertJsonStructure([
                'success',
                'transaction',
                'total_sell',
                'stock_left',
                'revenue',
                'total_net_profit',
                'average_profit_per_sale',
                'profit_margin_percent',
                'return_on_investment_percent',
                'total_investment',
                'this_week_revenue',
                'this_week_net_profit',
                'weekly_sales_volume',
                'weekly_profit_margin_percent',
                'weekly_growth_rate_percent',
                'avg_daily_revenue',
                'avg_daily_profit',
                'avg_daily_sales',
                'this_month_revenue',
                'this_month_net_profit',
                'monthly_sales_volume',
                'monthly_profit_margin_percent',
                'monthly_growth_rate_percent',
                'avg_monthly_daily_revenue',
                'avg_monthly_daily_profit',
                'avg_monthly_daily_sales',
                'item_performance',
                'top_performing_items',
                'slow_moving_items',
            ])
            ->assertJsonPath('success', true);
    }

    public function test_index_computes_correct_metrics(): void
    {
        // Monday 9 Nov 2026 -> week starts Sunday 8 Nov, day of month = 9
        Carbon::setTestNow('2026-11-09 12:00:00');

        [$user, $itemA] = $this->makeUserWithItem();
        $itemB = Item::factory()->create(['user_id' => $user->id]);

        // A: today. revenue 32, profit 12, stock 6
        $this->makeTransaction($itemA, [
            'total_buy' => 10, 'total_sell' => 4,
            'cost_price' => 5, 'selling_price' => 8,
            'transaction_date' => '2026-11-09',
        ]);
        // B: last month. revenue 40, profit 20, stock 3
        $this->makeTransaction($itemB, [
            'total_buy' => 5, 'total_sell' => 2,
            'cost_price' => 10, 'selling_price' => 20,
            'transaction_date' => '2026-10-15',
        ]);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/transaction')->assertOk();

        // totals
        $this->assertEquals(6, $response->json('total_sell'));
        $this->assertEquals(9, $response->json('stock_left'));
        $this->assertEquals(72, $response->json('revenue'));
        $this->assertEquals(32, $response->json('total_net_profit'));
        $this->assertEquals(5.33, $response->json('average_profit_per_sale'));
        $this->assertEquals(44.44, $response->json('profit_margin_percent'));
        $this->assertEquals(100, $response->json('total_investment'));
        $this->assertEquals(32, $response->json('return_on_investment_percent'));

        // weekly (only A)
        $this->assertEquals(32, $response->json('this_week_revenue'));
        $this->assertEquals(12, $response->json('this_week_net_profit'));
        $this->assertEquals(4, $response->json('weekly_sales_volume'));
        $this->assertEquals(37.5, $response->json('weekly_profit_margin_percent'));
        $this->assertEquals(0, $response->json('weekly_growth_rate_percent')); // no previous week data
        $this->assertEquals(4.57, $response->json('avg_daily_revenue'));
        $this->assertEquals(1.71, $response->json('avg_daily_profit'));
        $this->assertEquals(0.57, $response->json('avg_daily_sales'));

        // monthly (only A, 9 days elapsed) vs previous month revenue 40
        $this->assertEquals(32, $response->json('this_month_revenue'));
        $this->assertEquals(12, $response->json('this_month_net_profit'));
        $this->assertEquals(4, $response->json('monthly_sales_volume'));
        $this->assertEquals(-20, $response->json('monthly_growth_rate_percent'));
        $this->assertEquals(3.56, $response->json('avg_monthly_daily_revenue'));
        $this->assertEquals(1.33, $response->json('avg_monthly_daily_profit'));
        $this->assertEquals(0.44, $response->json('avg_monthly_daily_sales'));

        // item performance sorted by profit desc (B=20, A=12)
        $this->assertCount(2, $response->json('item_performance'));
        $this->assertEquals($itemB->id, $response->json('item_performance.0.item_id'));
        $this->assertEquals(20, $response->json('item_performance.0.profit'));
        $this->assertEquals($itemA->id, $response->json('item_performance.1.item_id'));
    }

    public function test_index_only_returns_authenticated_users_transactions(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        [, $otherItem] = $this->makeUserWithItem();

        $mine   = $this->makeTransaction($item);
        $theirs = $this->makeTransaction($otherItem);

        Sanctum::actingAs($user);
        $response = $this->getJson('/api/transaction')->assertOk();

        $ids = collect($response->json('transaction'))->pluck('id');
        $this->assertTrue($ids->contains($mine->id));
        $this->assertFalse($ids->contains($theirs->id));
    }

    public function test_index_with_no_transactions_returns_zeroed_metrics(): void
    {
        [$user] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $response = $this->getJson('/api/transaction')->assertOk();

        $this->assertSame([], $response->json('transaction'));
        $this->assertEquals(0, $response->json('revenue'));
        $this->assertEquals(0, $response->json('total_net_profit'));
        $this->assertEquals(0, $response->json('profit_margin_percent'));
        $this->assertEquals(0, $response->json('weekly_growth_rate_percent'));
        $this->assertEquals(0, $response->json('monthly_growth_rate_percent'));
        $this->assertSame([], $response->json('item_performance'));
    }

    public function test_index_runs_a_single_transactions_query(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        $this->makeTransaction($item);
        Sanctum::actingAs($user);

        DB::flushQueryLog();
        DB::enableQueryLog();
        $this->getJson('/api/transaction')->assertOk();
        $queries = collect(DB::getQueryLog())->pluck('query');
        DB::disableQueryLog();

        $transactionQueries = $queries->filter(
            fn($q) => str_contains($q, 'from `transactions`') || str_contains($q, 'from "transactions"')
        );

        $this->assertCount(1, $transactionQueries);
    }

    // ---------- POST /transaction ----------

    public function test_add_creates_transaction(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $this->postJson('/api/transaction', $this->validPayload($item))
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'added successfully')
            ->assertJsonStructure(['transaction' => ['id', 'item_id']]);

        $this->assertDatabaseHas('transactions', [
            'item_id'   => $item->id,
            'total_buy' => 10,
        ]);
    }

    public function test_add_validates_payload(): void
    {
        [$user] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $this->postJson('/api/transaction', [])->assertUnprocessable();
    }

    public function test_add_returns_404_for_nonexistent_item(): void
    {
        [$user] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        // CreateTransactionRequest has no exists: rule, so findOrFail() gives 404.
        $this->postJson('/api/transaction', [
            'item_id' => 999999,
            'total_buy' => 1, 'total_sell' => 1,
            'cost_price' => 1, 'selling_price' => 1,
            'transaction_date' => now()->toDateString(),
        ])->assertNotFound();
    }

    /**
     * SECURITY: expected to FAIL against the current controller.
     * add() does Item::findOrFail($id) without checking ownership, so a user
     * can attach transactions to another user's item.
     */
    public function test_add_cannot_target_another_users_item(): void
    {
        [$user] = $this->makeUserWithItem();
        [, $foreignItem] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $status = $this->postJson('/api/transaction', $this->validPayload($foreignItem))->status();

        $this->assertContains($status, [403, 404, 422]);
        $this->assertDatabaseMissing('transactions', ['item_id' => $foreignItem->id]);
    }

    // ---------- GET /transaction/{id} ----------

    public function test_show_returns_own_transaction(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        $transaction = $this->makeTransaction($item);
        Sanctum::actingAs($user);

        // NOTE: controller currently returns 201 here (probably should be 200).
        // If you fix it, change this to assertOk().
        $this->getJson("/api/transaction/{$transaction->id}")
            ->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('transaction.id', $transaction->id);
    }

    public function test_show_returns_404_for_another_users_transaction(): void
    {
        [$user] = $this->makeUserWithItem();
        [, $otherItem] = $this->makeUserWithItem();
        $theirs = $this->makeTransaction($otherItem);
        Sanctum::actingAs($user);

        $this->getJson("/api/transaction/{$theirs->id}")->assertNotFound();
    }

    public function test_show_returns_404_for_missing_transaction(): void
    {
        [$user] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $this->getJson('/api/transaction/999999')->assertNotFound();
    }

    // ---------- PUT /transaction/{id} ----------

    public function test_update_modifies_own_transaction(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        $transaction = $this->makeTransaction($item, ['total_sell' => 4]);
        Sanctum::actingAs($user);

        $this->putJson("/api/transaction/{$transaction->id}", $this->validPayload($item, ['total_sell' => 7]))
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Transaction updated successfully')
            ->assertJsonPath('transaction.id', $transaction->id);

        $this->assertDatabaseHas('transactions', [
            'id'         => $transaction->id,
            'total_sell' => 7,
        ]);
    }

    public function test_update_returns_404_for_another_users_transaction(): void
    {
        [$user] = $this->makeUserWithItem();
        [, $otherItem] = $this->makeUserWithItem();
        $theirs = $this->makeTransaction($otherItem, ['total_sell' => 4]);
        Sanctum::actingAs($user);

        $this->putJson("/api/transaction/{$theirs->id}", $this->validPayload($otherItem, ['total_sell' => 99]))
            ->assertNotFound();

        $this->assertDatabaseHas('transactions', ['id' => $theirs->id, 'total_sell' => 4]);
    }

    public function test_update_returns_404_for_missing_transaction(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        Sanctum::actingAs($user);

        $this->putJson('/api/transaction/999999', $this->validPayload($item))->assertNotFound();
    }

    public function test_update_validates_payload(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        $transaction = $this->makeTransaction($item);
        Sanctum::actingAs($user);

        $this->putJson("/api/transaction/{$transaction->id}", ['total_sell' => 'not-a-number'])
            ->assertUnprocessable();
    }

    /**
     * SECURITY: item_id is not in UpdateTransactionRequest::rules(), so
     * validated() drops it and a transaction can't be moved to another item.
     * This test guards against someone adding item_id to the rules later.
     */
    public function test_update_cannot_reassign_transaction_to_another_users_item(): void
    {
        [$user, $item] = $this->makeUserWithItem();
        [, $foreignItem] = $this->makeUserWithItem();
        $transaction = $this->makeTransaction($item);
        Sanctum::actingAs($user);

        $this->putJson("/api/transaction/{$transaction->id}", $this->validPayload($foreignItem));

        $this->assertDatabaseHas('transactions', [
            'id'      => $transaction->id,
            'item_id' => $item->id,
        ]);
    }
}
