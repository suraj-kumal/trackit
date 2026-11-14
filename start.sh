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

# Temporary benchmark, only runs when BENCH=1 is set in Render
if [ "$BENCH" = "1" ]; then
    (
        sleep 20
        echo "=== PROCESSES ==="
        ps aux | grep -i '[s]woole\|[o]ctane'
        echo "=== BENCH c=1 ==="
        ab -k -n 500 -c 1 "http://127.0.0.1:${PORT:-10000}/api/ping" 2>&1
        echo "=== BENCH c=50 ==="
        ab -k -n 5000 -c 50 "http://127.0.0.1:${PORT:-10000}/api/ping" 2>&1
        echo "=== BENCH DONE ==="
    ) &
fi

exec php artisan octane:start \
    --server=swoole \
    --host=0.0.0.0 \
    --port="${PORT:-10000}" \
    --workers="${OCTANE_WORKERS:-2}" \
    --task-workers=1 \
    --max-requests=100000
