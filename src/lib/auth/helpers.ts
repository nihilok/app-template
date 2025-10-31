import { auth } from './config';
import { headers } from 'next/headers';

/**
 * Get the current authenticated user's session
 * 
 * @returns Session object if authenticated, null otherwise
 */
export async function getSession() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Get the current authenticated user's ID
 * 
 * @returns User ID if authenticated, null otherwise
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getSession();
  return session?.user?.id || null;
}

/**
 * Require authentication - throws error if not authenticated
 * 
 * @returns User ID
 * @throws Error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('Unauthorized');
  }
  return userId;
}
