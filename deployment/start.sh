#!/bin/bash
set -e

echo "🚀 Starting VISUAL Platform..."

# Create necessary directories
mkdir -p /app/logs /app/uploads /var/log/supervisor /var/log/nginx

# Set proper permissions
chown -R app:app /app/logs /app/uploads
chown -R www-data:www-data /var/log/nginx

# Remove nginx default site
rm -f /etc/nginx/sites-enabled/default

# Enable our site
ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/

# Test nginx configuration
nginx -t

echo "✅ Configuration validated"

# Start supervisor (which starts nginx and backend)
echo "🔄 Starting services..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/visual.conf