# Database Setup Guide

## Prerequisites

- PostgreSQL 15+ installed and running
- Database connection configured in `.env` file

## Setup Steps

### 1. Configure Database Connection

Update the `DATABASE_URL` in your `.env` file with your PostgreSQL credentials:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/worldspark?schema=public"
```

### 2. Create Database Migration

Run the following command to create and apply the initial migration:

```bash
npx prisma migrate dev --name init
```

This will:
- Create the migration files in `prisma/migrations/`
- Apply the migration to your database
- Generate the Prisma Client
- Run the seed script automatically

### 3. Manual Seed (if needed)

If you need to run the seed script manually:

```bash
npm run prisma:seed
```

Or using npx:

```bash
npx prisma db seed
```

## Database Schema

The schema includes three main tables:

### sparks
- Stores user-submitted thoughts/sparks
- Includes location data (latitude, longitude)
- Status field for moderation workflow (pending, approved, rejected)
- Indexed on status and created_at for performance

### categories
- Predefined categories for sparks
- Initial categories: Thought, Question, Observation, Dream, Memory

### admin_users
- Admin authentication
- Passwords are hashed with bcrypt
- Initial admin created from ADMIN_EMAIL and ADMIN_PASSWORD env vars

## Useful Commands

```bash
# Generate Prisma Client after schema changes
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## Seed Data

The seed script (`prisma/seed.ts`) creates:

1. **Categories**: Thought, Question, Observation, Dream, Memory
2. **Admin User**: Created from ADMIN_EMAIL and ADMIN_PASSWORD environment variables

Make sure to set these environment variables before running the seed script.

## Production Deployment

For production (e.g., Vercel):

1. Set up a PostgreSQL database (Vercel Postgres, Supabase, etc.)
2. Add DATABASE_URL to your environment variables
3. Run migrations: `npx prisma migrate deploy`
4. Seed the database: `npm run prisma:seed`

## Troubleshooting

### Migration fails
- Ensure PostgreSQL is running
- Check DATABASE_URL is correct
- Verify database user has CREATE permissions

### Seed fails
- Ensure migrations have been applied first
- Check ADMIN_EMAIL and ADMIN_PASSWORD are set in .env
- Verify database connection

### Client generation fails
- Delete `node_modules/.prisma` and `node_modules/@prisma/client`
- Run `npm run prisma:generate` again
