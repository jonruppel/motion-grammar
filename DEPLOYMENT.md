# Motion Grammar - Deployment Guide

## Overview
This guide covers deploying Motion Grammar to your production server at `motiongrammar.com`.

## Prerequisites

### 1. DNS Configuration
Before deploying, configure your DNS A records:
- `motiongrammar.com` → `208.109.241.221`
- `www.motiongrammar.com` → `208.109.241.221`

**Note:** DNS propagation can take up to 48 hours, but typically completes in a few hours.

### 2. Server Access
Ensure you have SSH access to your server:
```bash
ssh jonruppel@208.109.241.221
```

If you haven't set up SSH keys, you'll need to enter your password each time.

### 3. Server Requirements
Your server already has:
- Apache HTTP Server
- Let's Encrypt (certbot) for SSL certificates
- Mod_rewrite enabled for SPA routing

## What the Deploy Script Does

The `deploy.sh` script automates the entire deployment process:

1. **Packages your files:**
   - `index.html` - Main entry point
   - `js/` - All JavaScript modules
   - `styles/` - All CSS files
   - `images/` - Image assets
   - `README.md` - Project documentation

2. **Creates Apache configuration:**
   - Sets up virtual hosts for HTTP and HTTPS
   - Configures SSL with Let's Encrypt certificates
   - Enables SPA routing (all routes redirect to index.html)
   - Adds security headers
   - Configures caching for optimal performance

3. **Deploys to server:**
   - Creates `/var/www/motiongrammar/` directory
   - Uploads and extracts files
   - Sets correct permissions
   - Installs Apache configuration
   - Attempts to set up SSL automatically
   - Restarts Apache

## Deployment Steps

### Step 1: Deploy the Site

Run the deployment script:
```bash
./deploy.sh
```

The script will:
- Package all necessary files
- Upload to your server via SCP
- Deploy files to `/var/www/motiongrammar/`
- Configure Apache
- Attempt SSL setup (if DNS is configured)
- Restart Apache

### Step 2: Verify Deployment

After deployment, test the site:
- HTTP: `http://motiongrammar.com`
- HTTPS (if configured): `https://motiongrammar.com`

### Step 3: SSL Certificate (if needed)

If SSL wasn't automatically configured, SSH into your server and run:
```bash
ssh jonruppel@208.109.241.221
sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com
```

Follow the prompts to complete SSL setup.

## Server Directory Structure

```
/var/www/motiongrammar/
├── index.html
├── README.md
├── js/
│   ├── app.js
│   ├── components/
│   ├── core/
│   ├── pages/
│   ├── utils/
│   └── visualizations/
├── styles/
│   ├── global.css
│   ├── components.css
│   ├── navigation.css
│   ├── experiences.css
│   ├── mobile-preview.css
│   └── pages/
└── images/
    └── *.jpeg, *.png
```

## Apache Configuration

The Apache config includes:

**SPA Routing:**
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

**Security Headers:**
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

**Caching:**
- Static assets (JS, CSS, images): 1 year cache
- HTML files: no-cache (always fresh)

## Troubleshooting

### Issue: CSS files not loading (404 errors)

**Solution:** This was fixed by changing absolute paths to relative paths in all page files. The fix is already applied in your code.

### Issue: DNS not resolving

**Solution:** Check your DNS records and wait for propagation:
```bash
dig motiongrammar.com
nslookup motiongrammar.com
```

### Issue: SSL certificate fails

**Solution:** Ensure DNS is fully propagated, then run certbot manually:
```bash
sudo certbot --apache -d motiongrammar.com -d www.motiongrammar.com
```

### Issue: Apache configuration errors

**Solution:** Check Apache logs:
```bash
sudo tail -f /var/log/httpd/motiongrammar-error.log
sudo apachectl configtest
```

### Issue: Permission errors

**Solution:** Fix permissions:
```bash
sudo chown -R apache:apache /var/www/motiongrammar
sudo chmod -R 755 /var/www/motiongrammar
```

## Logs

Monitor your application:
```bash
# Error logs
sudo tail -f /var/log/httpd/motiongrammar-error.log

# Access logs
sudo tail -f /var/log/httpd/motiongrammar-access.log
```

## Re-deploying Updates

To deploy updates:
1. Make your code changes locally
2. Test thoroughly on `http://localhost:5556`
3. Run `./deploy.sh`

The script will:
- Clean old files
- Upload new version
- Restart Apache (minimal downtime)

## Production Checklist

Before going live:
- ✅ DNS configured and propagated
- ✅ SSL certificate installed
- ✅ All pages load correctly
- ✅ Navigation works (SPA routing)
- ✅ Images load properly
- ✅ Mobile responsive design works
- ✅ All experiences/visualizations function
- ✅ Check browser console for errors
- ✅ Test on multiple browsers

## Support

If you encounter issues:
1. Check the logs (see Logs section)
2. Verify Apache configuration: `sudo apachectl configtest`
3. Ensure all files are uploaded: `ls -la /var/www/motiongrammar/`
4. Check file permissions
5. Verify DNS resolution

## Notes

- The `server.js` and `package.json` files are for local development only and are NOT deployed to production
- Apache handles serving static files in production
- The site is a Single Page Application (SPA) using client-side routing
- All HTTP traffic is redirected to HTTPS for security

