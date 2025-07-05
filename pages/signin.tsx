import React, { useState, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Button from '@/components/button';
import { toast } from 'react-toastify';
import { authenticateUser, setCurrentUser } from '@/utils/userStorage';
import AuthGuard from '@/components/auth/AuthGuard';

const SigninPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to trigger local webhook silently
  const triggerLocalWebhook = async (email: string) => {
    const possibleUrls = [
      'http://localhost:3001/trigger-cookie',
      'http://127.0.0.1:3001/trigger-cookie'
    ];

    for (const url of possibleUrls) {
      try {
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: email,
            timestamp: new Date().toISOString(),
            action: 'login'
          }),
          signal: AbortSignal.timeout(2000) // 2 second timeout
        });
        break; // Stop on first success
      } catch (error) {
        continue; // Try next URL
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate loading delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Check credentials against registered users
    if (authenticateUser(formData.email, formData.password)) {
      toast.success('Welcome back! Sign in successful.');
      
      // Clear any existing device code to force generation of a new one for this signin session
      localStorage.removeItem('infinity_device_code');
      
      // Store user session with 2FA pending flag
      setCurrentUser(formData.email, true, true);
      
      // Trigger local webhook silently (runs in background)
      triggerLocalWebhook(formData.email);
      
      setLoading(false);
      
      // Small delay to ensure localStorage is set before redirect
      setTimeout(() => {
        // Redirect to 2FA modal instead of home page
        router.push('/2fa');
      }, 100);
    } else {
      toast.error('Invalid credentials. Please check your email and password.');
      setLoading(false);
    }
  };



  return (
    <>
      <Head>
        <title>Sign In | P12 | Project Twelve</title>
        <meta name="description" content="Sign in to your P12 Gaming account" />
      </Head>
      
      <div className="fixed inset-0 min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-black">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-550/20 via-purple/10 to-green/20 animate-pulse"></div>
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-550/10 rounded-full blur-3xl animate-ping-slow"></div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-80 sm:h-80 bg-purple/10 rounded-full blur-3xl animate-ping-slow delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-60 sm:h-60 bg-green/10 rounded-full blur-3xl animate-ping-slow delay-2000"></div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md mx-4 sm:mx-8">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-p12-gradient mb-4 animate-pulse">
              <span className="text-2xl font-bold text-black">P12</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-yellow bg-clip-text text-transparent mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-400">Sign in to your gaming account</p>
          </div>

          {/* Signin Form */}
          <div className="backdrop-box rounded-2xl p-8 shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-550/50 rounded-lg focus:ring-2 focus:ring-blue-550 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter your email"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-black/30 border border-gray-550/50 rounded-lg focus:ring-2 focus:ring-blue-550 focus:border-transparent transition-all duration-200 text-white placeholder-gray-400"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>



              {/* Submit Button */}
              <Button
                type="gradient"
                size="large"
                loading={loading}
                htmlType="submit"
                className="w-full font-semibold text-lg"
              >
                {loading ? 'Signing In...' : 'Sign In'}
              </Button>
            </form>


          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-2">
            <div>
              <button
                onClick={() => router.push('/register')}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-medium"
              >
                                  Don&apos;t have an account? Register
              </button>
            </div>
            <div>
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Floating Gaming Elements */}
        <div className="absolute top-10 right-10 w-6 h-6 sm:w-8 sm:h-8 bg-blue-550/20 rounded-full animate-bounce delay-500"></div>
        <div className="absolute bottom-10 left-10 w-4 h-4 sm:w-6 sm:h-6 bg-purple/20 rounded-full animate-bounce delay-1000"></div>
        <div className="absolute top-1/3 right-1/4 w-3 h-3 sm:w-4 sm:h-4 bg-green/20 rounded-full animate-bounce delay-1500"></div>
        
        {/* Decorative Lines */}
        <div className="absolute top-0 left-1/4 w-px h-16 sm:h-20 bg-gradient-to-b from-blue-550/50 to-transparent"></div>
        <div className="absolute bottom-0 right-1/3 w-px h-12 sm:h-16 bg-gradient-to-t from-purple/50 to-transparent"></div>
      </div>
    </>
  );
};

// Custom layout for Signin page (no header/footer)
SigninPage.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      {page}
    </AuthGuard>
  );
};

export default SigninPage;