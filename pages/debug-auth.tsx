import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Button from '@/components/button';

const DebugAuthPage = () => {
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window !== 'undefined') {
          const userStr = localStorage.getItem('user');
          setAuthInfo({
            localStorage: userStr,
            parsed: userStr ? JSON.parse(userStr) : null,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        setAuthInfo({
          error: 'data parsing error',
          timestamp: new Date().toISOString(),
        });
      }
      setLoading(false);
    };

    checkAuth();
    const interval = setInterval(checkAuth, 1000);

    return () => clearInterval(interval);
  }, []);

  const clearAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  };

  const setTestAuth = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify({ 
        email: 'admin123@bitgert.com', 
        authenticated: true 
      }));
    }
  };

  return (
    <>
      <Head>
        <title>Auth Debug | P12</title>
      </Head>
      
      <div className="min-h-screen p-8">
        <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
        
        <div className="backdrop-box rounded-xl p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Auth Status</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <pre className="bg-black/30 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(authInfo, null, 2)}
            </pre>
          )}
        </div>

        <div className="flex gap-4">
          <Button onClick={clearAuth} type="bordered">
            Clear Auth
          </Button>
          <Button onClick={setTestAuth} type="gradient">
            Set Test Auth
          </Button>
          <Button onClick={() => window.location.href = '/'} type="default">
            Go to Home
          </Button>
          <Button onClick={() => window.location.href = '/signin'} type="default">
            Go to Signin
          </Button>
        </div>
      </div>
    </>
  );
};

export default DebugAuthPage;