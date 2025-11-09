# TrackIt Backend API Documentation

## 🚀 Tech Stack

-   Laravel 10.x
-   PHP 8.2+
-   MySQL/PostgreSQL
-   Laravel Sanctum for API Authentication
-   Laravel Queue for Background Jobs

## 📋 Prerequisites

-   PHP >= 8.2
-   Composer
-   MySQL/PostgreSQL
-   Redis (optional, for queue)

## ⚙️ Installation Steps

1. **Clone Repository**

```bash
git clone https://github.com/yourusername/trackit.git
cd trackit
```

2. **Install Dependencies**

```bash
composer install
```

3. **Environment Setup**

```bash
cp .env.example .env
php artisan key:generate
```

4. **Configure Database**

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=trackit
DB_USERNAME=root
DB_PASSWORD=
```

5. **Run Migrations & Seeders**

```bash
php artisan migrate --seed
```

## 🗄️ Project Structure

```
├── app
│   ├── Http
│   │   ├── Controllers
│   │   ├── Middleware
│   │   └── Requests
│   ├── Models
│   ├── Services
│   └── Traits
├── config
├── database
│   ├── factories
│   ├── migrations
│   └── seeders
├── routes
│   ├── api.php
│   └── web.php
└── tests
```

## 🔑 API Authentication

We use Laravel Sanctum for API authentication.

```php
// Example Authentication Request
POST /api/login
{
    "email": "user@example.com",
    "password": "password"
}

// Response
{
    "token": "1|2345678..."
}
```

## 📚 API Endpoints

### Authentication

```
POST   /api/login           - Login user
POST   /api/register        - Register new user
POST   /api/logout         - Logout user
GET    /api/user           - Get authenticated user
```

### Tasks

```
GET    /api/tasks          - List all tasks
POST   /api/tasks          - Create new task
GET    /api/tasks/{id}     - Get single task
PUT    /api/tasks/{id}     - Update task
DELETE /api/tasks/{id}     - Delete task
```

## 🛠️ Development Commands

```bash
# Start development server
php artisan serve

# Run tests
php artisan test

# Create migration
php artisan make:migration create_table_name

# Create controller
php artisan make:controller ControllerName --api

# Create model
php artisan make:model ModelName -mf
```

## 🧪 Testing

```bash
# Run all tests
php artisan test

# Run specific test file
php artisan test --filter UserTest

# Run tests with coverage
php artisan test --coverage
```

## 🔄 Database Seeding

```bash
# Run all seeders
php artisan db:seed

# Run specific seeder
php artisan db:seed --class=UserSeeder
```

## 📝 Coding Standards

We follow PSR-12 coding standards. Run PHP CS Fixer:

```bash
./vendor/bin/php-cs-fixer fix
```

## 🚀 Deployment

1. **Update Dependencies**

```bash
composer install --optimize-autoloader --no-dev
```

2. **Environment Setup**

```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. **Database Migration**

```bash
php artisan migrate --force
```

## ⚡ Performance Optimization

```bash
# Clear all caches
php artisan optimize:clear

# Optimize for production
php artisan optimize
```

## 🐛 Common Issues & Solutions

1. **Storage Link Issues**

```bash
php artisan storage:link
```

2. **Permission Issues**

```bash
chmod -R 775 storage bootstrap/cache
```

3. **Composer Dependencies**

```bash
composer dump-autoload
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/name`)
3. Commit changes (`git commit -am 'Add feature'`)
4. Push branch (`git push origin feature/name`)
5. Create Pull Request

## 📜 License

This project is licensed under the MIT License.
