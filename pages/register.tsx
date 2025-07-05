import React, { useState, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { registerUser, isUserRegistered } from '@/utils/userStorage';
import AuthGuard from '@/components/auth/AuthGuard';



function Register() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (email && password && confirmPassword) {
      // Check if passwords match
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match!');
        return;
      }
      
      // Check if user already exists
      if (isUserRegistered(email)) {
        setErrorMessage('User already exists. Please sign in instead.');
        return;
      }
      
      setIsLoading(true);
      
      // Simulate loading delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Register the user
      const registrationSuccess = registerUser(email, password);
      
      if (registrationSuccess) {
        setErrorMessage('');
        setSuccessMessage('✅ Registration successful! Redirecting to sign in...');
        
        setTimeout(() => {
          router.push('/signin');
        }, 2000);
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
      
      setIsLoading(false);
    } else {
      setErrorMessage('Please fill in all required fields!');
    }
  };

  return (
    <>
      <Head>
        <title>Register | P12 | Project Twelve</title>
        <link rel="icon" type="image/png" sizes="100x100" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <div className="register-page">
        {/* Background Effects */}
        <div className="bg-container">
          <div className="bg-gradient"></div>
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="bg-orb"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="floating-element"></div>
          <div className="decorative-line"></div>
          <div className="decorative-line"></div>
        </div>

        {/* Main Content */}
        <div className="main-container">
          {/* Logo Section */}
          <div className="logo-section">
            <div className="logo-icon">
              <span>P12</span>
            </div>
            <h1 className="logo-title">
              Join P12 Gaming
            </h1>
            <p className="logo-subtitle">
              Create your gaming account
            </p>
          </div>

          {/* Registration Form */}
          <div className="form-container">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
                <div className="form-input-wrapper">
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="Enter your email"
                    required
                  />
                  <svg className="form-input-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="form-input-wrapper">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-input"
                    placeholder="Enter your password"
                    required
                  />
                  <svg
                    className="form-input-icon password-toggle"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="form-input-wrapper">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="Confirm your password"
                    required
                  />
                  <svg
                    className="form-input-icon password-toggle"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"></path>
                    ) : (
                      <>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </>
                    )}
                  </svg>
                </div>
              </div>

              {errorMessage && (
                <div className="error-alert">
                  {errorMessage}
                </div>
              )}

              <button 
                type="button" 
                onClick={handleRegister} 
                className="register-btn"
                disabled={isLoading}
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          </div>

          {/* Navigation Links */}
          <div className="back-link-container">
            <button onClick={() => router.push('/signin')} className="back-link">
              ← Already have an account? Sign In
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="success-alert show">
            {successMessage}
          </div>
        )}

        <style jsx>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          .register-page {
            min-height: 100vh;
            background: #000;
            font-family: Arial, sans-serif;
            color: #fff;
            overflow-x: hidden;
          }
          
          /* Background Effects */
          .bg-container {
            position: fixed;
            inset: 0;
            min-height: 100vh;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            background: black;
          }
          
          .bg-gradient {
            position: absolute;
            inset: 0;
            background: linear-gradient(45deg, rgba(67, 187, 255, 0.2) 0%, rgba(252, 89, 255, 0.1) 50%, rgba(30, 219, 140, 0.2) 100%);
            animation: pulse 4s ease-in-out infinite;
          }
          
          .bg-orb {
            position: absolute;
            border-radius: 50%;
            filter: blur(60px);
            animation: float 6s ease-in-out infinite;
          }
          
          .bg-orb:nth-child(2) {
            top: 10%;
            left: 10%;
            width: 300px;
            height: 300px;
            background: rgba(67, 187, 255, 0.1);
            animation-delay: -2s;
          }
          
          .bg-orb:nth-child(3) {
            bottom: 10%;
            right: 10%;
            width: 200px;
            height: 200px;
            background: rgba(252, 89, 255, 0.1);
            animation-delay: -1s;
          }
          
          .bg-orb:nth-child(4) {
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 150px;
            height: 150px;
            background: rgba(30, 219, 140, 0.1);
            animation-delay: -3s;
          }
          
          /* Floating Elements */
          .floating-element {
            position: absolute;
            border-radius: 50%;
            animation: bounce 3s ease-in-out infinite;
          }
          
          .floating-element:nth-child(5) {
            top: 5%;
            right: 5%;
            width: 20px;
            height: 20px;
            background: rgba(67, 187, 255, 0.3);
            animation-delay: 0.5s;
          }
          
          .floating-element:nth-child(6) {
            bottom: 5%;
            left: 5%;
            width: 15px;
            height: 15px;
            background: rgba(252, 89, 255, 0.3);
            animation-delay: 1s;
          }
          
          .floating-element:nth-child(7) {
            top: 30%;
            right: 20%;
            width: 10px;
            height: 10px;
            background: rgba(30, 219, 140, 0.3);
            animation-delay: 1.5s;
          }
          
          /* Decorative Lines */
          .decorative-line {
            position: absolute;
            width: 1px;
            background: linear-gradient(to bottom, rgba(67, 187, 255, 0.5), transparent);
          }
          
          .decorative-line:nth-child(8) {
            top: 0;
            left: 25%;
            height: 80px;
          }
          
          .decorative-line:nth-child(9) {
            bottom: 0;
            right: 30%;
            height: 60px;
            background: linear-gradient(to top, rgba(252, 89, 255, 0.5), transparent);
          }
          
          /* Main Container */
          .main-container {
            position: relative;
            z-index: 10;
            width: 100%;
            max-width: 450px;
            margin: 0 auto;
            padding: 2rem;
          }
          
          /* Logo Section */
          .logo-section {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .logo-icon {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 80px;
            height: 80px;
            border-radius: 50%;
            background: linear-gradient(to right, #43BBFF, #FC59FF);
            margin-bottom: 1rem;
            animation: pulse 2s ease-in-out infinite;
          }
          
          .logo-icon span {
            font-size: 2rem;
            font-weight: bold;
            color: #000;
          }
          
          .logo-title {
            font-size: 2rem;
            font-weight: bold;
            background: linear-gradient(to bottom, #FFFFDA 0%, #FFE7B6 50%, #CE9658 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
          }
          
          .logo-subtitle {
            color: #A5A6AB;
            font-size: 1rem;
          }
          
          /* Form Container */
          .form-container {
            background: rgba(61, 68, 75, 0.5);
            border: 1px solid rgb(70, 75, 90);
            backdrop-filter: blur(16px);
            border-radius: 1rem;
            padding: 2rem;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          }
          
          .form-group {
            margin-bottom: 1.5rem;
          }
          
          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 500;
            color: #CEDCFF;
            margin-bottom: 0.5rem;
          }
          
          .form-input-wrapper {
            position: relative;
          }
          
          .form-input {
            width: 100%;
            padding: 0.75rem 1rem;
            padding-right: 2.5rem;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(111, 119, 132, 0.5);
            border-radius: 0.5rem;
            color: #fff;
            font-size: 1rem;
            transition: all 0.2s ease;
          }
          
          .form-input:focus {
            outline: none;
            border-color: #43BBFF;
            box-shadow: 0 0 0 2px rgba(67, 187, 255, 0.2);
          }
          
          .form-input::placeholder {
            color: #A5A6AB;
          }
          
          .form-input-icon {
            position: absolute;
            right: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            width: 1.25rem;
            height: 1.25rem;
            color: #A5A6AB;
            cursor: pointer;
            transition: color 0.2s ease;
          }
          
          .form-input-icon:hover {
            color: #fff;
          }
          
          /* Error Alert */
          .error-alert {
            text-align: center;
            font-size: 0.875rem;
            color: #FF6B6B;
            margin-top: 0.5rem;
          }
          
          /* Button */
          .register-btn {
            width: 100%;
            padding: 0.75rem 1.5rem;
            background: linear-gradient(to right, #43BBFF, #FC59FF);
            border: none;
            border-radius: 0.5rem;
            color: #000;
            font-size: 1.125rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            display: block;
            text-align: center;
          }
          
          .register-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(67, 187, 255, 0.3);
          }
          
          .register-btn:active {
            transform: translateY(0);
          }
          
          .register-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none;
          }
          
          .register-btn:disabled:hover {
            transform: none;
            box-shadow: none;
          }
          
          /* Back Link */
          .back-link-container {
            margin-top: 2rem;
            text-align: center;
          }
          
          .back-link {
            color: #A5A6AB;
            text-decoration: none;
            font-size: 0.875rem;
            transition: color 0.2s ease;
            background: none;
            border: none;
            cursor: pointer;
          }
          
          .back-link:hover {
            color: #fff;
          }
          
          /* Success Alert */
          .success-alert {
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(30, 219, 140, 0.9);
            color: #000;
            padding: 1rem 2rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            z-index: 1001;
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .success-alert.show {
            opacity: 1;
          }
          
          /* Animations */
          @keyframes pulse {
            0%, 100% {
              opacity: 1;
            }
            50% {
              opacity: 0.5;
            }
          }
          
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-20px);
            }
          }
          
          @keyframes bounce {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
          
          /* Responsive Design */
          @media (max-width: 640px) {
            .main-container {
              padding: 1rem;
            }
            
            .form-container {
              padding: 1.5rem;
            }
            
            .logo-icon {
              width: 60px;
              height: 60px;
            }
            
            .logo-icon span {
              font-size: 1.5rem;
            }
            
            .logo-title {
              font-size: 1.5rem;
            }
            
            .modal-content {
              width: 95%;
              padding: 1.5rem;
            }
            
            .verification-input {
              width: 35px;
              height: 35px;
              font-size: 1rem;
            }
            
            .bg-orb:nth-child(2) {
              width: 200px;
              height: 200px;
            }
            
            .bg-orb:nth-child(3) {
              width: 150px;
              height: 150px;
            }
            
            .bg-orb:nth-child(4) {
              width: 100px;
              height: 100px;
            }
          }
        `}</style>
      </div>
    </>
  );
}

// Custom layout for Register page (no header/footer)
Register.getLayout = function getLayout(page: ReactElement) {
  return (
    <AuthGuard>
      {page}
    </AuthGuard>
  );
};

export default Register; 