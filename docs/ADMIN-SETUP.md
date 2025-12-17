# Admin User Setup Guide

This document provides instructions for creating and managing admin users in World Spark.

## Overview

World Spark requires at least one admin user to access the moderation panel and approve/reject spark submissions. Admin users are stored in the PostgreSQL database with bcrypt-hashed passwords.

## Quick Start (Development)

1. Set environment variables in `.env`:
   ```env
   ADMIN_EMAIL="admin@example.com"
   ADMIN_PASSWORD="your-secure-password"
   ```

2. Run the admin seed script:
   ```bash
   npm run prisma:seed-admin
   ```

3. Access the admin panel at `/admin/login`

## Production Setup

### Step 1: Generate Secure Credentials

Generate a strong password that meets these requirements:
- Minimum 12 characters
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{}|;':",.<>/?)

**Recommended**: Use a password manager to generate and store credentials.

### Step 2: Set Environment Variables

#### Vercel Deployment

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `ADMIN_EMAIL` | Your admin email | Production |
| `ADMIN_PASSWORD` | Your secure password | Production |
| `DATABASE_URL` | PostgreSQL connection string | Production |
| `NEXTAUTH_SECRET` | Random 32+ character string | Production |
| `NEXTAUTH_URL` | Your production URL | Production |

**Important**: Mark `ADMIN_PASSWORD` and `NEXTAUTH_SECRET` as sensitive.

#### Other Hosting Providers

Set environment variables according to your provider's documentation:
- **Railway**: Settings → Variables
- **Render**: Environment → Environment Variables
- **AWS**: Parameter Store or Secrets Manager
- **Docker**: Use `.env` file or Docker secrets

### Step 3: Run the Seed Script

#### Option A: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Link to your project
vercel link

# Run the seed script with production environment
vercel env pull .env.production.local
npx tsx prisma/seed-admin.ts
```

#### Option B: Via Database Connection

If you have direct database access:

```bash
# Set DATABASE_URL to your production database
export DATABASE_URL="postgresql://user:password@host:5432/worldspark"
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="YourSecurePassword123!"

# Run the seed script
npx tsx prisma/seed-admin.ts
```

#### Option C: Via Vercel Function (Recommended for Vercel)

Create a one-time deployment script that runs during build:

1. The seed script runs automatically with `prisma migrate deploy`
2. Or trigger manually via Vercel's serverless function

### Step 4: Verify Admin Access

1. Navigate to `https://your-domain.com/admin/login`
2. Enter your admin credentials
3. Verify you can access the moderation panel

### Step 5: Secure Credential Storage

After creating the admin user:

1. **Store credentials securely**:
   - Use a password manager (1Password, Bitwarden, LastPass)
   - Never store in plain text files
   - Never commit to version control

2. **Document access**:
   - Record who has admin access
   - Maintain an access log
   - Review access periodically

3. **Backup recovery**:
   - Store recovery information securely
   - Document the process to reset admin password

## Managing Admin Users

### Adding Additional Admins

To add more admin users, you can:

1. **Update environment variables and re-run seed**:
   ```bash
   export ADMIN_EMAIL="newadmin@example.com"
   export ADMIN_PASSWORD="SecurePassword123!"
   npm run prisma:seed-admin
   ```

2. **Use Prisma Studio** (development only):
   ```bash
   npx prisma studio
   ```
   Navigate to `admin_users` table and add a new record.
   Note: You'll need to manually hash the password.

3. **Create a custom script**:
   ```typescript
   import { PrismaClient } from '@prisma/client';
   import bcrypt from 'bcrypt';

   const prisma = new PrismaClient();

   async function addAdmin(email: string, password: string) {
     const passwordHash = await bcrypt.hash(password, 10);
     await prisma.adminUser.create({
       data: { email, passwordHash }
     });
   }
   ```

### Changing Admin Password

1. Delete the existing admin user
2. Re-run the seed script with new password

Or use a custom script:
```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function updatePassword(email: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({
    where: { email },
    data: { passwordHash }
  });
}
```

### Removing Admin Users

```bash
# Using Prisma Studio
npx prisma studio
# Navigate to admin_users and delete the record

# Or via script
npx tsx -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.adminUser.delete({ where: { email: 'admin@example.com' } })
  .then(() => console.log('Deleted'))
  .finally(() => prisma.\$disconnect());
"
```

## Security Best Practices

### Password Requirements

For production environments, passwords must:
- Be at least 12 characters long
- Contain uppercase and lowercase letters
- Contain numbers and special characters
- Be unique (not used elsewhere)
- Be changed regularly (every 90 days recommended)

### Access Control

- Limit the number of admin users
- Use individual accounts (no shared credentials)
- Review admin access regularly
- Remove access for departed team members immediately

### Session Security

- Sessions expire after 24 hours
- HTTP-only cookies prevent XSS attacks
- Secure cookies in production (HTTPS only)
- CSRF protection enabled by default

### Monitoring

- Monitor failed login attempts
- Set up alerts for suspicious activity
- Review moderation logs regularly

## Troubleshooting

### "Admin user already exists"

The seed script won't overwrite existing users. To update:
1. Delete the existing user via Prisma Studio
2. Re-run the seed script

### "Password does not meet security requirements"

In production, passwords must meet all security requirements. Check:
- Length (minimum 12 characters)
- Uppercase letters
- Lowercase letters
- Numbers
- Special characters

### "Cannot connect to database"

Verify:
- `DATABASE_URL` is set correctly
- Database server is running
- Network/firewall allows connection
- SSL settings are correct for production

### "Unauthorized" after login

Check:
- `NEXTAUTH_SECRET` is set and matches across deployments
- `NEXTAUTH_URL` matches your actual URL
- Session cookies are being set correctly

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `ADMIN_EMAIL` | Admin user email address | Yes (for seed) |
| `ADMIN_PASSWORD` | Admin user password | Yes (for seed) |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Yes |
| `NEXTAUTH_URL` | Application URL | Yes |
| `NODE_ENV` | Environment (development/production) | Recommended |

## Related Documentation

- [Authentication Overview](./AUTHENTICATION.md)
- [Security Guidelines](./SECURITY.md)
- [Deployment Guide](../README.md)
