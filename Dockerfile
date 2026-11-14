ARG PHP_VERSION=8.4
FROM php:${PHP_VERSION}-cli

WORKDIR /var/www/html

ADD https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN chmod +x /usr/local/bin/install-php-extensions \
    && install-php-extensions swoole pdo_pgsql pgsql pcntl bcmath

RUN apt-get update && apt-get install -y --no-install-recommends git unzip \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Cache the vendor layer
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction --prefer-dist

COPY --chown=www-data:www-data . .
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction \
    && mkdir -p storage/framework/{cache,sessions,views} storage/logs bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && sed -i 's/\r$//' start.sh && chmod +x start.sh

USER www-data
EXPOSE 10000
CMD ["./start.sh"]
