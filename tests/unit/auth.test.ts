import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

describe('Admin Authentication', () => {
  const testAdminEmail = 'test-admin@example.com';
  const testAdminPassword = 'test-password-123';
  let testAdminId: string;

  beforeAll(async () => {
    // Create a test admin user
    const passwordHash = await bcrypt.hash(testAdminPassword, 10);
    const admin = await prisma.adminUser.create({
      data: {
        email: testAdminEmail,
        passwordHash,
      },
    });
    testAdminId = admin.id;
  });

  afterAll(async () => {
    // Clean up test admin user
    await prisma.adminUser.delete({
      where: { id: testAdminId },
    });
  });

  it('should hash passwords with bcrypt', async () => {
    const password = 'test-password';
    const hash = await bcrypt.hash(password, 10);
    
    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(0);
  });

  it('should verify correct password', async () => {
    const admin = await prisma.adminUser.findUnique({
      where: { email: testAdminEmail },
    });

    expect(admin).toBeDefined();
    
    const isValid = await bcrypt.compare(testAdminPassword, admin!.passwordHash);
    expect(isValid).toBe(true);
  });

  it('should reject incorrect password', async () => {
    const admin = await prisma.adminUser.findUnique({
      where: { email: testAdminEmail },
    });

    expect(admin).toBeDefined();
    
    const isValid = await bcrypt.compare('wrong-password', admin!.passwordHash);
    expect(isValid).toBe(false);
  });

  it('should store admin user with correct schema', async () => {
    const admin = await prisma.adminUser.findUnique({
      where: { email: testAdminEmail },
    });

    expect(admin).toBeDefined();
    expect(admin?.id).toBeDefined();
    expect(admin?.email).toBe(testAdminEmail);
    expect(admin?.passwordHash).toBeDefined();
    expect(admin?.createdAt).toBeInstanceOf(Date);
  });
});
