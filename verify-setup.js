// Simple script to verify the project setup
const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying World Spark project setup...\n');

const checks = [
  { name: 'package.json', path: './package.json' },
  { name: 'tsconfig.json', path: './tsconfig.json' },
  { name: 'next.config.js', path: './next.config.js' },
  { name: 'Prisma schema', path: './prisma/schema.prisma' },
  { name: 'App layout', path: './app/layout.tsx' },
  { name: 'App page', path: './app/page.tsx' },
  { name: 'Global CSS', path: './app/globals.css' },
  { name: 'Vitest config', path: './vitest.config.ts' },
  { name: 'Playwright config', path: './playwright.config.ts' },
  { name: 'ESLint config', path: './.eslintrc.json' },
  { name: 'Prettier config', path: './.prettierrc' },
  { name: 'Tailwind config', path: './tailwind.config.ts' },
  { name: 'Environment template', path: './.env.example' },
];

let allPassed = true;

checks.forEach(check => {
  const exists = fs.existsSync(check.path);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${check.name}`);
  if (!exists) allPassed = false;
});

console.log('\n📁 Directory structure:');
const dirs = ['app', 'components', 'lib', 'prisma', 'tests', 'public'];
dirs.forEach(dir => {
  const exists = fs.existsSync(`./${dir}`);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${dir}/`);
  if (!exists) allPassed = false;
});

console.log('\n' + (allPassed ? '✅ All checks passed!' : '❌ Some checks failed'));
console.log('\n📝 Next steps:');
console.log('1. Run: npm install');
console.log('2. Copy .env.example to .env and configure database');
console.log('3. Run: npx prisma generate');
console.log('4. Run: npm run dev');
