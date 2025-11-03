import { useAuth } from '../context/AuthContext';

/**
 * Hook to check if the current user has admin privileges
 * @returns {boolean} true if the user is an admin, false otherwise
 */
export function useAdmin(): boolean {
  const { isAdmin } = useAuth();
  return isAdmin;
}
