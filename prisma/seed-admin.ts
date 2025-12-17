/**
 * Admin User Seed Script
 * 
 * This script creates the initial admin user for the World Spark application.
 * It can be run independently of the main seed script.
 * 
 * Usage:
 *   Development: npx ts-node prisma/seed-admin.ts
 *   Production:  npx ts-node prisma/seed-admin.ts
 * 
 * Environment Variables Required:
 *   - DATABASE_URL: PostgreSQL connection string
 *   - ADMIN_EMAIL: Admin user email address
 *   - ADMIN_PASSWORD: Admin user password (will be hashed with bcrypt)
 * 
 * Security Notes:
 *   - Never commit actual credentials to version control
 *   - Use strong passwords (min 12 characters, mixed case, numbers, symbols)
 *   - Change the default password immediately after first login
 *   - In production, set environment variables securely (e.g., Vercel dashboard)
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Password strength validation
function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Email validation
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

async function seedAdminUser() {
  console.log('='.repeat(60));
  console.log('World Spark - Admin User Setup');
  console.log('='.repeat(60));
  console.log('');

  // Get credentials from environment variables
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  // Validate environment variables
  if (!adminEmail) {
    console.error('❌ Error: ADMIN_EMAIL environment variable is not set');
    console.log('');
    console.log('Please set the ADMIN_EMAIL environment variable:');
    console.log('  - In .env file for development');
    console.log('  - In Vercel dashboard for production');
    process.exit(1);
  }

  if (!adminPassword) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable is not set');
    console.log('');
    console.log('Please set the ADMIN_PASSWORD environment variable:');
    console.log('  - In .env file for development');
    console.log('  - In Vercel dashboard for production');
    process.exit(1);
  }

  // Validate email format
  if (!validateEmail(adminEmail)) {
    console.error('❌ Error: Invalid email format');
    process.exit(1);
  }

  // Validate password strength (skip in development for convenience)
  const isProduction = process.env.NODE_ENV === 'production';
  if (isProduction) {
    const passwordValidation = validatePassword(adminPassword);
    if (!passwordValidation.valid) {
      console.error('❌ Error: Password does not meet security requirements:');
      passwordValidation.errors.forEach(error => {
        console.error(`   - ${error}`);
      });
      process.exit(1);
    }
  } else {
    console.log('⚠️  Development mode: Password strength validation skipped');
    console.log('   In production, passwords must meet security requirements.');
    console.log('');
  }

  try {
    // Check if admin user already exists
    const existingAdmin = await prisma.adminUser.findUnique({
      where: { email: adminEmail }
    });

    if (existingAdmin) {
      console.log(`ℹ️  Admin user already exists: ${adminEmail}`);
      console.log('   To update the password, delete the user first or use a different email.');
      return;
    }

    // Hash password with bcrypt (10 rounds as specified in design)
    console.log('🔐 Hashing password with bcrypt (10 rounds)...');
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    console.log('📝 Creating admin user...');
    const adminUser = await prisma.adminUser.create({
      data: {
        email: adminEmail,
        passwordHash: passwordHash
      }
    });

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('='.repeat(60));
    console.log('Admin User Details');
    console.log('='.repeat(60));
    console.log(`   ID:    ${adminUser.id}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Created: ${adminUser.createdAt.toISOString()}`);
    console.log('');
    console.log('🔒 Security Reminders:');
    console.log('   - Store credentials securely (password manager recommended)');
    console.log('   - Never share credentials via email or chat');
    console.log('   - Change password regularly');
    console.log('   - Use unique password for this application');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

// Main execution
seedAdminUser()
  .catch((e) => {
    console.error('Unexpected error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
