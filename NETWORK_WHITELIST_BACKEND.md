# Network Whitelist - Backend API

This document lists all external domains and services that the **Adapt Backend API** (NestJS) needs to access. These should be whitelisted on your secure server's network/firewall.

---

## External Third-Party Services

### 1. Google reCAPTCHA Verification Service

**Required for:** Server-side verification of reCAPTCHA tokens

**Domain:**
- `www.google.com` (port 443/HTTPS)
- Specific endpoint: `https://www.google.com/recaptcha/api/siteverify`

**Usage:** Validates reCAPTCHA tokens submitted from the frontend during user authentication and form submissions.

**To Enable:**
1. Whitelist `www.google.com` domain

---


## Internal Services

These services should be accessible via local network or localhost:

### 1. PostgreSQL Database

**Required for:** Data persistence and storage

**Default Connection:**
- Host: `localhost` (or private IP)
- Port: `5432` (default, configurable)
- Protocol: PostgreSQL wire protocol

**Configuration:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
```

**SSL/TLS:**
```env
NODE_ENV=production  # Enables SSL for database connection
```

**Network Requirements:**
- Allow TCP connection from API server to database server on port 5432
- Use private network or VPN for database connections
- Do not expose database to public internet

---

### 3. Frontend Application (CORS)

**Required for:** Cross-Origin Resource Sharing (CORS)

**Allowed Origins:**
- Production frontend URL (configured via environment variable)

**Configuration:**
```env
FRONTEND_URL=https://yourdomain.com
```

**Network Requirements:**
- API server must be accessible from frontend server
- Configure reverse proxy/load balancer if needed
- Ensure proper SSL certificates for HTTPS

---

## Build Time Dependencies

### NPM Registry

**Required for:** Installing Node.js dependencies during build

**Domain:**
- `registry.npmjs.org` (port 443/HTTPS)

**Usage:** Required during `npm install` or `npm ci` commands when building the application.

**Note:** Only needed during build/deployment, not required for runtime.

---

## Firewall Rules Summary

### Outbound Rules (Production Runtime)

| Destination | Port | Protocol | Purpose | Required |
|-------------|------|----------|---------|----------|
| `www.google.com` | 443 | HTTPS | reCAPTCHA verification | ⚠️ Yes |

### Internal Network Access (Required)

| Service | Default Port | Protocol | Purpose | Required |
|---------|--------------|----------|---------|----------|
| PostgreSQL | 5432 | TCP | Database | ✅ Yes |
| Frontend | Varies | HTTP/HTTPS | CORS origin | ✅ Yes |

### Build Time Only

| Destination | Port | Protocol | Purpose | Required |
|-------------|------|----------|---------|----------|
| `registry.npmjs.org` | 443 | HTTPS | NPM packages | ✅ Yes (build only) |

---

## Testing Network Connectivity

### Test External Services

```bash
# Test reCAPTCHA endpoint (if enabled)
curl -X POST https://www.google.com/recaptcha/api/siteverify \
  -d "secret=YOUR_SECRET&response=test"

# Test NPM Registry (build time)
curl -I https://registry.npmjs.org

```

### Test Internal Services

```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U postgres -d ncmcl_db -c "SELECT version();"

---

## Environment Variables

### Required Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration (REQUIRED)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=
DB_PASSWORD=
DB_NAME=

# Frontend CORS (REQUIRED)
FRONTEND_URL=https://yourdomain.com

# JWT/Authentication
JWT_SECRET=
JWT_REFRESH_SECRET=

# File Encryption
ENCRYPTION_KEY=

RECAPTCHA_SECRET_KEY=
```

---

## Security Considerations

1. **Minimize External Dependencies**
   - The backend has minimal external dependencies by design
   - Most operations use internal services (database)
   - Only reCAPTCHA requires external network access

2. **Database Security**
   - Never expose PostgreSQL to public internet
   - Use private network or VPN for database connections
   - Enable SSL/TLS for database connections in production
   - Use strong passwords and rotate them regularly
   - Restrict database access by IP address

4. **File Upload Security**
   - Files are encrypted at rest using AES-256-GCM
   - File type validation based on magic numbers, not just extensions
   - Size limits enforced per form field configuration

5. **API Security**
   - Use HTTPS in production (TLS 1.2+)
   - Validate and sanitize all user inputs
   - Use prepared statements for database queries (TypeORM does this)

6. **reCAPTCHA Considerations**
   - Tokens are single-use and expire quickly
   - Keep secret key confidential
   - Monitor verification success rates

---


## Deployment Checklist

Before deploying to production:

### Database
- [ ] PostgreSQL installed and running
- [ ] Database created with proper credentials
- [ ] Migrations executed successfully
- [ ] Database accessible from API server
- [ ] SSL/TLS enabled for database connections
- [ ] Database backups configured


### Environment Variables
- [ ] All required environment variables set
- [ ] Strong passwords and secrets generated
- [ ] FRONTEND_URL configured correctly
- [ ] Database credentials validated

### Network Configuration
- [ ] Firewall allows internal service connections
- [ ] reCAPTCHA domain whitelisted
- [ ] NPM registry accessible for builds

### Security
- [ ] API running behind reverse proxy (nginx/Apache)
- [ ] HTTPS/TLS certificates configured
- [ ] Rate limiting configured
- [ ] CORS origins properly restricted
- [ ] File upload directory permissions set correctly
- [ ] Log rotation configured

---

## Troubleshooting

### Database Connection Issues

**Symptoms:** "Connection refused" or "Database timeout" errors

**Solution:**
1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check connection parameters in `.env`
3. Test connection: `psql -h DB_HOST -p DB_PORT -U DB_USERNAME -d DB_NAME`
4. Check firewall rules if database is on another server
5. Review PostgreSQL logs: `/var/log/postgresql/`

### CORS Errors

**Symptoms:** "CORS policy blocked" errors in frontend

**Solution:**
1. Verify `FRONTEND_URL` is set correctly
2. Check CORS configuration in `src/main.ts`
3. Ensure frontend is using correct API URL
4. Check reverse proxy CORS headers if applicable

### reCAPTCHA Verification Failures

**Symptoms:** "reCAPTCHA verification failed" errors

**Solution:**
1. Verify `RECAPTCHA_SECRET_KEY` is set correctly
2. Check network access to `www.google.com`
3. Ensure frontend is sending valid tokens
4. Check for clock skew between servers
5. Review error codes in logs

---

## Monitoring and Maintenance

## Support

For questions or issues related to backend network configuration:
- Review application logs for specific error messages
- Check service status: `systemctl status [service-name]`
- Test connections manually using provided commands
- Contact your DevOps team or system administrator

**Last Updated:** December 18, 2024

