import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface User {
  email: string;
  authenticated: boolean;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export const useAuth = () => {
  const router = useRouter();
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          if (userStr) {
            const user = JSON.parse(userStr);
            if (user.authenticated) {
              setAuthState({
                user,
                loading: false,
                isAuthenticated: true,
              });
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error);
      }
      
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    };

    checkAuth();
  }, []);

  const signIn = (email: string) => {
    const user = { email, authenticated: true };
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
    setAuthState({
      user,
      loading: false,
      isAuthenticated: true,
    });
  };

  const signOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });
    router.push('/signin');
  };

  const requireAuth = () => {
    if (!authState.loading && !authState.isAuthenticated) {
      router.push('/signin');
      return false;
    }
    return true;
  };

  return {
    ...authState,
    signIn,
    signOut,
    requireAuth,
  };
};

export default useAuth;