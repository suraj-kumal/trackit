# WhereStock

It is a REST API for tracking inventory and sales. It lets users manage
items and their buy/sell records, then calculates stock, revenue, profit, and
weekly and monthly performance metrics.

## https://where-stock.onrender.com

## Features

- Token-based API authentication with Laravel Sanctum
- User-owned item and transaction records
- Inventory and sales analytics, including stock value, sell-through, and
  estimated days of stock remaining
- Email verification and password reset flows

## Getting started

### Requirements

- PHP 8.2 or later
- Composer
- A database supported by Laravel; the example environment is configured for
  SQLite
- Node.js and npm if you want to build the included Vite assets

### Install and run locally

```bash
git clone https://github.com/suraj-kumal/trackit.git
cd trackit
composer install
cp .env.example .env
php artisan key:generate
php -r "file_exists('database/database.sqlite') || touch('database/database.sqlite');"
php artisan migrate
php artisan serve
```

The API is available at `http://127.0.0.1:8000/api`. The example environment
uses SQLite. If you choose another supported database, configure its connection
in `.env` before running migrations.

To process queued work such as email notifications, run a worker in another
terminal:

```bash
php artisan queue:work
```

To build the included frontend assets:

```bash
npm install
npm run build
```

### Make an API request

Register to receive an API token:

```bash
curl -X POST http://127.0.0.1:8000/api/register \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name":"Alex","email":"alex@example.com","password":"ChangeMe123!","password_confirmation":"ChangeMe123!"}'
```

Use the returned token as a bearer token on protected routes. For example, add
an item and then record a transaction for its ID:

```bash
curl -X POST http://127.0.0.1:8000/api/item \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"name":"Notebook"}'

curl -X POST http://127.0.0.1:8000/api/transaction \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -d '{"item_id":1,"total_buy":20,"total_sell":5,"cost_price":2.50,"selling_price":4.00,"transaction_date":"2026-01-15"}'

curl http://127.0.0.1:8000/api/transaction \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Accept: application/json"
```

Replace `item_id` with the ID returned when you create the item. The transaction
list response includes aggregate analytics for the authenticated user's items.

## Development and tests

Run the test suite with:

```bash
composer test
```

## Help

For bugs, questions, or feature requests, open an
[issue in the GitHub repository](https://github.com/suraj-kumal/trackit/issues).
The API routes and validation rules in [routes/api.php](routes/api.php) and
[app/Http/Requests/](app/Http/Requests/) are the current reference for request
details.

## Maintainers and contributing

WhereStock is maintained by [suraj-kumal](https://github.com/suraj-kumal).
Contributions are welcome: open an issue to discuss a change, then submit a pull
request with a clear description and tests for behavior you add or change.