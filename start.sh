#!/bin/sh
set -e

php artisan package:discover --ansi
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Queue worker: restarts itself if it exits or crashes
(
    while true; do
        php artisan queue:work \
            --sleep=3 --tries=3 --timeout=80 \
            --max-time=3600 --max-jobs=500 || true
        echo "queue worker exited, restarting in 2s" >&2
        sleep 2
    done
) &

exec php artisan octane:start \
    --server=swoole \
    --host=0.0.0.0 \
    --port="${PORT:-10000}" \
    --workers="${OCTANE_WORKERS:-2}" \
    --task-workers=1 \
    --max-requests=500
