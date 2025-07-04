import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface AuthGuardProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/signin', '/debug-auth', '/register.html'];

const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            // User is fully authenticated only if they have authenticated: true AND needs2FA is false/undefined
            if (user.authenticated && !user.needs2FA) {
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
      }
      
      setIsAuthenticated(false);
      setLoading(false);
    };

    // Initial check
    checkAuth();

    // Listen for storage changes (for when user signs in)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically to catch localStorage changes from same tab
    const interval = setInterval(checkAuth, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (loading) return; // Wait for auth check to complete

    const currentPath = router.pathname;
    const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);

    if (!isAuthenticated && !isPublicRoute) {
      // Redirect to signin if not authenticated and not on a public route
      router.replace('/signin');
    }
    // Remove the auto-redirect from signin page when authenticated
    // Let the signin page handle the redirect after successful login
  }, [isAuthenticated, loading, router]);

  // Show loading screen while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-p12-gradient mb-4 animate-pulse">
            <span className="text-xl font-bold text-black">P12</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-550 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show signin page or protected content
  const currentPath = router.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(currentPath);

  if (!isAuthenticated && !isPublicRoute) {
    // This will be handled by the redirect in useEffect, but show loading in the meantime
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-p12-gradient mb-4 animate-pulse">
            <span className="text-xl font-bold text-black">P12</span>
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-550 mx-auto mb-4"></div>
          <p className="text-gray-400">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AuthGuard;