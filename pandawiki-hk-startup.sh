#!/bin/bash
# Exit immediately if a command exits with a non-zero status.
set -e

# Update package lists and install Nginx
apt-get update
apt-get install -y -qq nginx

# Set the IP address of the US core application's load balancer
US_LB_IP="34.49.30.45"

# Create the Nginx configuration file
cat <<EOF > /etc/nginx/sites-available/default
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name docs.aiapi.services;

    # Health check endpoint for the load balancer
    location /healthz {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }

    # Proxy all other requests to the US load balancer
    location / {
        proxy_pass https://${US_LB_IP};
        
        # Required for SSL proxying
        proxy_ssl_server_name on;
        proxy_ssl_name docs.aiapi.services;
        
        # Set headers to pass client information to the backend
        proxy_set_header Host docs.aiapi.services;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        
        # Settings for WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Set timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
EOF

# Test the Nginx configuration for syntax errors
nginx -t

# Restart Nginx to apply the new configuration
systemctl restart nginx 