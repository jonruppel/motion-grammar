#!/bin/bash

# Deploy script for Motion Grammar
# Automated deployment to production server

set -e  # Exit on any error

echo "🚀 Deploying Motion Grammar to Production..."

# Clean up and create local zip directory
rm -rf /Users/jonruppel/Sites/motion-grammar/zips && mkdir -p /Users/jonruppel/Sites/motion-grammar/zips

# Copy files to zip directory (app source + static assets)
cp -r js zips/js/
cp -r styles zips/styles/
cp -r images zips/images/
cp -r data zips/data/
cp -r music zips/music/
cp index.html zips/index.html

echo "✅ Files packaged for deployment"

# Create HTTP Apache configuration file
cat > zips/motiongrammar.conf << 'EOL'
# Handle HTTP access and redirect to HTTPS
<VirtualHost *:80>
    ServerName motiongrammar.com
    ServerAlias www.motiongrammar.com
    DocumentRoot /var/www/html/motiongrammar

    <Directory /var/www/html/motiongrammar>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.html
    </Directory>

    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>
EOL

# Create HTTPS Apache configuration file
cat > zips/motiongrammar-le-ssl.conf << 'EOL'
<IfModule mod_ssl.c>
<VirtualHost *:443>
    ServerName motiongrammar.com
    ServerAlias www.motiongrammar.com
    DocumentRoot /var/www/html/motiongrammar

    <Directory /var/www/html/motiongrammar>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        DirectoryIndex index.html
    </Directory>

    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/motiongrammar.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/motiongrammar.com/privkey.pem
    Include /etc/letsencrypt/options-ssl-apache.conf
</VirtualHost>
</IfModule>
EOL

# Create zip file
zip -r zips.zip zips/*

echo "✅ Deployment package created"

# Copy zip file to server
echo "📦 Uploading to server..."
scp /Users/jonruppel/Sites/motion-grammar/zips.zip jonruppel@208.109.241.221:/home/jonruppel/

# SSH into server and deploy
echo "🔧 Deploying on server..."
ssh jonruppel@208.109.241.221 '
    # Create necessary directories if they dont exist
    sudo mkdir -p /var/www/html/motiongrammar/{js,styles,images,data,music}
    
    # Clean existing directories
    sudo rm -rf /var/www/html/motiongrammar/js/*
    sudo rm -rf /var/www/html/motiongrammar/styles/*
    sudo rm -rf /var/www/html/motiongrammar/images/*
    sudo rm -rf /var/www/html/motiongrammar/data/*
    sudo rm -rf /var/www/html/motiongrammar/music/*
    sudo rm -f /var/www/html/motiongrammar/index.html
    sudo rm -f /var/www/html/motiongrammar/README.md

    # Extract and move files
    cd /var/www/html/motiongrammar
    sudo unzip -o ~/zips.zip
    sudo mv zips/js/* js/
    sudo mv zips/styles/* styles/
    sudo mv zips/images/* images/
    sudo mv zips/data/* data/ || true
    sudo mv zips/music/* music/ || true
    sudo mv zips/index.html .
    sudo mv zips/README.md . 2>/dev/null || true

    # Set permissions
    sudo chown -R apache:apache /var/www/html/motiongrammar
    sudo chmod -R 755 /var/www/html/motiongrammar

    # Check if SSL certificates exist
    if sudo test -f /etc/letsencrypt/live/motiongrammar.com/fullchain.pem && sudo test -f /etc/letsencrypt/live/motiongrammar.com/privkey.pem; then
        echo "✅ SSL certificate found for motiongrammar.com"
        echo "Installing Apache configuration with SSL..."
        sudo mv zips/motiongrammar.conf /etc/httpd/conf.d/motiongrammar.conf
    else
        echo "⚠️  SSL certificate for motiongrammar.com not found."
        echo "Setting up HTTP-only configuration. SSL will be added automatically..."
        
        # Create HTTP-only Apache config
        sudo tee /etc/httpd/conf.d/motiongrammar.conf > /dev/null << HTTPEOF
# Handle HTTP access (SSL will be added automatically)
<VirtualHost *:80>
    ServerName motiongrammar.com
    ServerAlias www.motiongrammar.com
    DocumentRoot /var/www/html/motiongrammar
</VirtualHost>

# Directory configuration
<Directory /var/www/html/motiongrammar>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted

    # Enable URL rewriting for SPA routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        
        # If the request is not for a file or directory
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        # Rewrite to index.html (static SPA)
        RewriteRule ^ index.html [L]
    </IfModule>

    # Security headers
    Header always set X-Frame-Options DENY
    Header always set X-Content-Type-Options nosniff
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</Directory>

# Cache static assets for 1 year
<FilesMatch "\.(js|css|png|jpg|jpeg|gif|svg|woff|woff2|ttf|ico|mp3)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>

# Do not cache HTML files
<FilesMatch "\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
</FilesMatch>

# Logging
LogLevel warn
ErrorLog /var/log/httpd/motiongrammar-error.log
CustomLog /var/log/httpd/motiongrammar-access.log combined
HTTPEOF
        
        # Try to automatically set up SSL with certbot
        echo "Attempting to set up SSL certificate..."
        if command -v certbot &> /dev/null; then
            sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com --non-interactive --agree-tos --email jon@jonruppel.com --redirect
            if [ $? -eq 0 ]; then
                echo "✅ SSL certificate successfully installed!"
            else
                echo "⚠️  SSL setup failed. You can manually set up SSL later with:"
                echo "   sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com"
            fi
        else
            echo "⚠️  Certbot not found. Install it and run:"
            echo "   sudo yum install certbot python3-certbot-apache"
            echo "   sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com"
        fi
    fi
    sudo rm -rf zips
    sudo rm -f ~/zips.zip

    # Verify Apache configuration and restart
    echo "Testing Apache configuration..."
    if sudo apachectl configtest; then
        echo "Configuration test passed. Restarting Apache..."
        sudo systemctl restart httpd
        echo "✅ Apache restarted successfully."
        
        # Check if we have SSL or not for final message
        if sudo test -f /etc/letsencrypt/live/motiongrammar.com/fullchain.pem; then
            echo "🎉 Motion Grammar deployed to https://motiongrammar.com"
            echo "🎉 Also accessible at https://www.motiongrammar.com"
        else
            echo "🎉 Motion Grammar deployed to http://motiongrammar.com"
            echo "⚠️  Note: Running on HTTP only. Make sure DNS is configured and run:"
            echo "   sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com"
        fi
    else
        echo "❌ Apache configuration test failed."
        exit 1
    fi
'

# Clean up local zip files
rm -rf /Users/jonruppel/Sites/motion-grammar/zips
rm -f /Users/jonruppel/Sites/motion-grammar/zips.zip

echo ""
echo "🎉 Deployment Complete!"
echo "🌐 Motion Grammar is now live!"
echo "📋 Next Steps:"
echo "   1. Ensure DNS A records are configured:"
echo "      - motiongrammar.com → 208.109.241.221"
echo "      - www.motiongrammar.com → 208.109.241.221"
echo "   2. Access at: http://motiongrammar.com (or https if SSL is configured)"
echo "   3. If SSL isn't configured, run:"
echo "      sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com"
