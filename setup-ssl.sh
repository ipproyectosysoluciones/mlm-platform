#!/bin/bash
# SSL Setup script for MLM Platform
# Usage: ./setup-ssl.sh yourdomain.com

DOMAIN=${1:-localhost}
SSL_DIR="./ssl"

echo "🔐 Setting up SSL for: $DOMAIN"

mkdir -p $SSL_DIR

if [ "$DOMAIN" = "localhost" ]; then
    echo "📝 Generating self-signed certificate for localhost..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout $SSL_DIR/privkey.pem \
        -out $SSL_DIR/fullchain.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    echo "✅ Self-signed certificate created (valid for 365 days)"
else
    echo "📝 For production, use Let's Encrypt:"
    echo ""
    echo "1. Install certbot on your host:"
    echo "   sudo apt install certbot"
    echo ""
    echo "2. Generate certificates:"
    echo "   sudo certbot certonly --standalone -d $DOMAIN"
    echo ""
    echo "3. Copy certificates to this directory:"
    echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem $SSL_DIR/"
    echo "   sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem $SSL_DIR/"
    echo "   sudo chown $(id -u):$(id -g) $SSL_DIR/*.pem"
    echo ""
    echo "4. Setup auto-renewal:"
    echo "   sudo crontab -e"
    echo "   # Add: 0 12 * * * /usr/bin/certbot renew --quiet --deploy-hook 'cd $(pwd) && docker compose restart frontend'"
fi

echo ""
echo "🚀 Start the platform with SSL:"
echo "   docker compose -f docker-compose.prod.yml up -d"
