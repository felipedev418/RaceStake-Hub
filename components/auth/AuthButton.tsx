import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Button from '@/components/button';

const AuthButton: React.FC = () => {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.authenticated) {
              setUser(userData);
              setIsAuthenticated(true);
              setLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth in AuthButton:', error);
      }
      
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
    };

    checkAuth();

    // Check periodically for auth changes
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/signin';
  };

  if (loading) {
    return (
      <div className="w-8 h-8 animate-pulse bg-white/10 rounded-full"></div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Button
        type="gradient"
        size="small"
        onClick={() => router.push('/signin')}
        className="text-sm font-medium"
      >
        Sign In
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full backdrop-blur">
        <div className="w-2 h-2 bg-green rounded-full animate-pulse"></div>
        <span className="text-sm text-gray-300 max-w-32 truncate">
          {user?.email?.split('@')[0]}
        </span>
      </div>
      <Button
        type="bordered"
        size="small"
        onClick={handleSignOut}
        className="text-sm font-medium hover:bg-red/10"
      >
        Sign Out
      </Button>
    </div>
  );
};

export default AuthButton;