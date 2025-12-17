import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

/**
 * Get the current session in server components
 * Returns null if not authenticated
 */
export async function getCurrentSession() {
  return await getServerSession(authOptions);
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated() {
  const session = await getCurrentSession();
  return !!session;
}

/**
 * Get the current admin user or throw error
 * Use this in API routes that require authentication
 */
export async function requireAuth() {
  const session = await getCurrentSession();
  
  if (!session) {
    throw new Error('Unauthorized');
  }
  
  return session;
}
