import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Button from '@/components/button';

const AuthDemoPage = () => {
  const [user, setUser] = useState<{ email: string } | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const userData = JSON.parse(userStr);
          setUser(userData);
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
    window.location.href = '/signin';
  };

  return (
    <>
      <Head>
        <title>Auth Demo | P12 | Project Twelve</title>
        <meta name="description" content="Authentication Demo Page" />
      </Head>
      
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="backdrop-box rounded-2xl p-8 max-w-md mx-auto">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green/20 mb-6">
              <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gradient-yellow mb-4">
              Authentication Successful!
            </h1>
            
            <div className="mb-6 p-4 bg-green/10 rounded-lg border border-green/20">
              <p className="text-sm text-gray-300 mb-2">Signed in as:</p>
              <p className="text-green font-mono text-sm break-all">{user?.email}</p>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                This is a protected page that requires authentication. 
                You can now access all authenticated features.
              </p>
              
              <div className="flex gap-3 justify-center">
                <Button
                  type="gradient"
                  onClick={() => window.location.href = '/'}
                  className="px-6"
                >
                  Go to Home
                </Button>
                
                <Button
                  type="bordered"
                  onClick={handleSignOut}
                  className="px-6 hover:bg-red/10"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Demo credentials: admin123@bitgert.com / root12345
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthDemoPage;