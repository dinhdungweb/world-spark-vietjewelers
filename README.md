# World Spark

A quiet side project by Viet Jewelers, Hanoi.

World Spark is an interactive web experience featuring a 3D globe where user-submitted thoughts ("sparks") appear as pulsing points of light.

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL 15+
- npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Set up the database:
```bash
npx prisma migrate dev
npx prisma generate
```

4. Create the initial admin user:
```bash
npm run prisma:seed-admin
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Admin Access

Access the admin moderation panel at `/admin/login` using the credentials set in your `.env` file.

For production setup and security guidelines, see [Admin Setup Guide](docs/ADMIN-SETUP.md).

## Testing

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e
```

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **3D Rendering**: React Three Fiber, Three.js, Drei
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Testing**: Vitest, React Testing Library, fast-check, Playwright
- **Authentication**: NextAuth.js (admin only)

## Project Structure

```
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/                 # Utility functions and services
├── prisma/              # Database schema and migrations
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── property/       # Property-based tests
│   └── e2e/            # End-to-end tests
└── public/             # Static assets
```

## License

Private project.
