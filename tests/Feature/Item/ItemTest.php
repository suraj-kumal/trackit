<?php

namespace Tests\Feature\Item;

use App\Models\User;
use App\Models\Item;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Illuminate\Support\Facades\Auth;

class ItemTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($this->user);
    }

    // ==========================================
    // GET ALL ITEMS
    // ==========================================

    public function test_user_can_get_all_items(): void
    {
        Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        Item::create([
            'name' => 'Mouse',
            'user_id' => $this->user->id,
        ]);

        Item::create([
            'name' => 'Keyboard',
            'user_id' => $this->user->id,
        ]);

        $response = $this->getJson('/api/item');

        $response->assertOk()
            ->assertJson(['success' => true])
            ->assertJsonCount(3, 'items');
    }

    public function test_user_gets_empty_items_array_when_no_items_exist(): void
    {
        $response = $this->getJson('/api/item');

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'items' => [],
            ]);
    }

    public function test_user_only_gets_their_own_items(): void
    {
        $anotherUser = User::create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => bcrypt('password'),
        ]);

        Item::create([
            'name' => 'My Laptop',
            'user_id' => $this->user->id,
        ]);

        Item::create([
            'name' => 'Other Laptop',
            'user_id' => $anotherUser->id,
        ]);

        $response = $this->getJson('/api/item');

        $response->assertOk()
            ->assertJsonCount(1, 'items')
            ->assertJsonFragment(['name' => 'My Laptop'])
            ->assertJsonMissing(['name' => 'Other Laptop']);
    }

    // ==========================================
    // GET SINGLE ITEM
    // ==========================================

    public function test_user_can_get_single_item(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->getJson('/api/item/' . $item->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'item' => [
                    'id' => $item->id,
                    'name' => 'Laptop',
                ],
            ]);
    }

    public function test_user_cannot_get_non_existing_item(): void
    {
        $response = $this->getJson('/api/item/9999');

        $response->assertNotFound();
    }

    public function test_user_cannot_get_another_users_item(): void
    {
        $anotherUser = User::create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => bcrypt('password'),
        ]);

        $item = Item::create([
            'name' => 'Other Laptop',
            'user_id' => $anotherUser->id,
        ]);

        $response = $this->getJson('/api/item/' . $item->id);

        $response->assertNotFound();
    }

    // ==========================================
    // ADD ITEM
    // ==========================================

    public function test_user_can_add_item(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => 'Laptop',
        ]);

        $response->assertCreated()
            ->assertJson([
                'success' => true,
                'message' => 'item added successfully',
            ])
            ->assertJsonPath('item.name', 'Laptop')
            ->assertJsonPath('item.user_id', $this->user->id);

        $this->assertDatabaseHas('items', [
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);
    }

    public function test_user_cannot_add_item_without_name(): void
    {
        $response = $this->postJson('/api/item', []);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_cannot_add_item_with_empty_name(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_cannot_add_item_with_non_string_name(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => 123,
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_add_item_with_minimum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => 'ABC',
        ]);

        $response->assertCreated()
            ->assertJsonPath('item.name', 'ABC');
    }

    public function test_user_cannot_add_item_below_minimum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => 'AB',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_add_item_above_minimum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => 'Laptop',
        ]);

        $response->assertCreated();
    }

    public function test_user_can_add_item_with_maximum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => str_repeat('A', 255),
        ]);

        $response->assertCreated();
    }

    public function test_user_cannot_add_item_above_maximum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => str_repeat('A', 256),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_add_item_below_maximum_name_length(): void
    {
        $response = $this->postJson('/api/item', [
            'name' => str_repeat('A', 254),
        ]);

        $response->assertCreated();
    }

    // ==========================================
    // UPDATE ITEM
    // ==========================================

    public function test_user_can_update_item(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => 'Gaming Laptop',
        ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'updated successfully',
            ]);

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'name' => 'Gaming Laptop',
        ]);
    }

    public function test_user_cannot_update_non_existing_item(): void
    {
        $response = $this->putJson('/api/item/9999', [
            'name' => 'Gaming Laptop',
        ]);

        $response->assertNotFound();
    }

    public function test_user_cannot_update_another_users_item(): void
    {
        $anotherUser = User::create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => bcrypt('password'),
        ]);

        $item = Item::create([
            'name' => 'Other Laptop',
            'user_id' => $anotherUser->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => 'Hacked Laptop',
        ]);

        $response->assertNotFound();

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'name' => 'Other Laptop',
        ]);
    }

    public function test_user_cannot_update_item_with_invalid_name(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => '',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_update_item_with_minimum_name_length(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => 'ABC',
        ]);

        $response->assertOk();
    }

    public function test_user_cannot_update_item_below_minimum_name_length(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => 'AB',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_user_can_update_item_with_maximum_name_length(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => str_repeat('A', 255),
        ]);

        $response->assertOk();
    }

    public function test_user_cannot_update_item_above_maximum_name_length(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->putJson('/api/item/' . $item->id, [
            'name' => str_repeat('A', 256),
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    // ==========================================
    // DELETE ITEM
    // ==========================================

    public function test_user_can_delete_item(): void
    {
        $item = Item::create([
            'name' => 'Laptop',
            'user_id' => $this->user->id,
        ]);

        $response = $this->deleteJson('/api/item/' . $item->id);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'delete successfully',
            ]);

        $this->assertDatabaseMissing('items', [
            'id' => $item->id,
        ]);
    }

    public function test_user_cannot_delete_non_existing_item(): void
    {
        $response = $this->deleteJson('/api/item/9999');

        $response->assertNotFound();
    }

    public function test_user_cannot_delete_another_users_item(): void
    {
        $anotherUser = User::create([
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => bcrypt('password'),
        ]);

        $item = Item::create([
            'name' => 'Other Laptop',
            'user_id' => $anotherUser->id,
        ]);

        $response = $this->deleteJson('/api/item/' . $item->id);

        $response->assertNotFound();

        $this->assertDatabaseHas('items', [
            'id' => $item->id,
            'name' => 'Other Laptop',
        ]);
    }

    // ==========================================
    // AUTHENTICATION
    // ==========================================

    public function test_unauthenticated_user_cannot_access_items(): void
    {
        auth()->logout();

        $response = $this->getJson('/api/item');

        $response->assertUnauthorized();
    }

}
