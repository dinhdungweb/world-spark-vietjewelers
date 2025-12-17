# Admin Authentication

This document describes the admin authentication system for World Spark.

## Overview

World Spark uses NextAuth.js for admin authentication with a credentials provider. Only authenticated admins can access the moderation panel and admin API routes.

## Setup

### Environment Variables

Add the following to your `.env` file:

```env
# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# Admin credentials (for initial setup)
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-this-password"
```

### Create Admin User

Run the admin seed script to create the initial admin user:

```bash
npm run prisma:seed-admin
```

This will create an admin user with the email and password specified in your `.env` file. The password is hashed using bcrypt with 10 rounds.

For detailed setup instructions including production deployment, see [Admin Setup Guide](./ADMIN-SETUP.md).

## Usage

### Login

Navigate to `/admin/login` to access the admin login page. Enter your admin credentials to authenticate.

### Protected Routes

The following routes are protected and require authentication:

- `/admin/*` - All admin pages (except `/admin/login`)
- `/api/admin/*` - All admin API routes

If you try to access a protected route without authentication, you'll be redirected to the login page.

### Server Components

To check authentication in server components:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/admin/login');
  }

  // Your protected page content
  return <div>Welcome, {session.user.email}</div>;
}
```

### API Routes

To protect API routes:

```typescript
import { requireAuth } from '@/lib/auth-helpers';

export async function GET() {
  try {
    const session = await requireAuth();
    
    // Your protected API logic
    return Response.json({ message: 'Success' });
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

### Client Components

To access session data in client components:

```typescript
'use client';

import { useSession, signOut } from 'next-auth/react';

export default function AdminHeader() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <p>Logged in as: {session.user.email}</p>
      <button onClick={() => signOut()}>Sign Out</button>
    </div>
  );
}
```

## Security Features

- **Password Hashing**: Passwords are hashed using bcrypt with 10 rounds
- **JWT Sessions**: Sessions are stored as JWTs (no server-side session storage)
- **HTTP-Only Cookies**: Session tokens are stored in HTTP-only cookies
- **Middleware Protection**: Routes are protected at the middleware level
- **CSRF Protection**: NextAuth.js includes built-in CSRF protection

## Adding New Admin Users

To add new admin users, you can either:

1. Update the seed script and run it again
2. Create a manual script to add users
3. Build an admin user management interface (future enhancement)

Example script to add a new admin:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function addAdmin(email: string, password: string) {
  const passwordHash = await bcrypt.hash(password, 10);
  
  await prisma.adminUser.create({
    data: {
      email,
      passwordHash,
    },
  });
  
  console.log(`Admin user created: ${email}`);
}

// Usage
addAdmin('newadmin@example.com', 'secure-password')
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
```

## Troubleshooting

### "Unauthorized" errors

- Make sure you're logged in
- Check that your session hasn't expired
- Verify that `NEXTAUTH_SECRET` is set in your environment variables

### Can't log in

- Verify the admin user exists in the database
- Check that the password is correct
- Ensure the database connection is working
- Check browser console for errors

### Redirected to login page unexpectedly

- Your session may have expired
- Check that `NEXTAUTH_URL` matches your application URL
- Verify middleware configuration is correct
