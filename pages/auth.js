// pages/auth.js
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useApp } from '../context/AppContext';
import { authAPI, formatPhoneToStandard } from '../utils/api';
import styles from '../styles/auth.module.css';

export default function Auth() {
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    loginPhone: '',
    loginPassword: '',
    registerName: '',
    registerPhone: '',
    registerLocation: '',
    registerPassword: '',
    registerRole: 'employee',
    forgotPhone: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [verificationCode, setVerificationCode] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(0);
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  const { user, token, currentLanguage, setUser, setLanguage, showMessage } = useApp();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (token && user) {
      router.push('/');
    }
  }, [token, user, router]);

  // Countdown timer for verification code
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && isResendDisabled) {
      setIsResendDisabled(false);
    }
    return () => clearTimeout(timer);
  }, [countdown, isResendDisabled]);

  const toggleLanguage = () => {
    const newLanguage = currentLanguage === 'en' ? 'sw' : 'en';
    setLanguage(newLanguage);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
  };

  const showForgotPassword = () => {
    setActiveTab('forgot');
  };

  const showLogin = () => {
    setActiveTab('login');
  };

  const showVerification = () => {
    setActiveTab('verification');
    setCountdown(60);
    setIsResendDisabled(true);
  };

  const showResetPassword = () => {
    setActiveTab('reset');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleVerificationCodeChange = (index, value) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newCode = [...verificationCode];
      newCode[index] = value;
      setVerificationCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.querySelector(`.${styles.codeInput}:nth-child(${index + 2})`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const moveToNext = (currentInput, nextIndex) => {
    if (currentInput.value && nextIndex <= 5) {
      const nextInput = document.querySelector(`.${styles.codeInput}:nth-child(${nextIndex + 1})`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { loginPhone, loginPassword } = formData;
    
    if (!loginPhone || !loginPassword) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Please enter both phone number and password' 
          : 'Tafadhali weka nambari ya simu na nenosiri',
        'error'
      );
      return;
    }

    try {
      const formattedPhone = formatPhoneToStandard(loginPhone);
      
      const data = await authAPI.login(formattedPhone, loginPassword);
      
      if (data.success) {
        setUser({
          user: data.user,
          token: data.token,
          userRole: data.user.role
        });
        
        showMessage(
          currentLanguage === 'en' 
            ? 'Login successful! Redirecting...' 
            : 'Umefanikiwa kuingia! Unaelekezwa...',
          'success'
        );
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Login failed. Please check your credentials.' 
          : 'Imeshindwa kuingia. Tafadhali angalia maelezo yako.'),
        'error'
      );
    }
  };

  const handleRegistration = async (e) => {
    e.preventDefault();
    
    const { registerName, registerPhone, registerLocation, registerPassword, registerRole } = formData;
    
    if (!registerName || !registerPhone || !registerPassword || !registerLocation) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Please fill in all required fields' 
          : 'Tafadhali jaza sehemu zote zinazohitajika',
        'error'
      );
      return;
    }

    try {
      const formattedPhone = formatPhoneToStandard(registerPhone);
      
      const userData = {
        name: registerName,
        phone: formattedPhone,
        password: registerPassword,
        role: registerRole,
        location: registerLocation
      };

      const data = await authAPI.register(userData);
      
      if (data.success) {
        setUser({
          user: data.user,
          token: data.token,
          userRole: data.user.role
        });
        
        showMessage(
          currentLanguage === 'en' 
            ? 'Account created! Redirecting...' 
            : 'Akaunti imeundwa! Unaelekezwa...',
          'success'
        );
        
        setTimeout(() => {
          router.push('/');
        }, 1500);
      }
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Registration failed. Please try again.' 
          : 'Usajili umeshindwa. Tafadhali jaribu tena.'),
        'error'
      );
    }
  };

  const sendPasswordResetCode = async () => {
    const { forgotPhone } = formData;
    
    if (!forgotPhone) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Please enter your phone number' 
          : 'Tafadhali weka nambari yako ya simu',
        'error'
      );
      return;
    }

    try {
      const formattedPhone = formatPhoneToStandard(forgotPhone);
      await authAPI.forgotPassword(formattedPhone);
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Reset code sent to your phone' 
          : 'Msimbo wa kubadilisha umetumwa kwenye simu yako',
        'success'
      );
      
      showVerification();
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to send reset code' 
          : 'Imeshindwa kutuma msimbo wa kubadilisha'),
        'error'
      );
    }
  };

  const resendVerificationCode = () => {
    setCountdown(60);
    setIsResendDisabled(true);
    showMessage(
      currentLanguage === 'en' 
        ? 'Verification code resent' 
        : 'Msimbo wa uthibitisho umetumwa tena',
      'success'
    );
  };

  const verifyCode = () => {
    const code = verificationCode.join('');
    if (code.length === 6) {
      showResetPassword();
    } else {
      showMessage(
        currentLanguage === 'en' 
          ? 'Please enter the complete verification code' 
          : 'Tafadhali weka msimbo kamili wa uthibitisho',
        'error'
      );
    }
  };

  const resetPassword = async () => {
    const { newPassword, confirmPassword, resetCode } = formData;
    
    if (!newPassword || !confirmPassword || !resetCode) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Please fill in all fields' 
          : 'Tafadhali jaza sehemu zote',
        'error'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage(
        currentLanguage === 'en' 
          ? 'Passwords do not match' 
          : 'Nenosiri halinafanani',
        'error'
      );
      return;
    }

    try {
      const resetData = {
        code: resetCode,
        newPassword: newPassword
      };

      await authAPI.resetPassword(resetData);
      
      showMessage(
        currentLanguage === 'en' 
          ? 'Password reset successfully' 
          : 'Nenosiri limebadilishwa kikamilifu',
        'success'
      );
      
      showLogin();
    } catch (error) {
      showMessage(
        error.message || 
        (currentLanguage === 'en' 
          ? 'Failed to reset password' 
          : 'Imeshindwa kubadilisha nenosiri'),
        'error'
      );
    }
  };

  const translations = {
    en: {
      welcome: "Kazi Mashinani",
      tagline: "Connecting Rural Talent with Opportunities",
      login: "Login",
      register: "Register",
      phoneNumber: "Phone Number",
      password: "Password",
      enterPassword: "Enter your password",
      forgotPassword: "Forgot Password?",
      fullName: "Full Name",
      enterName: "Enter your full name",
      enterLocation: "Enter your location",
      createPassword: "Create a password",
      iAm: "I am",
      jobSeeker: "Job Seeker",
      employer: "Employer",
      phoneVerification: "Phone Verification",
      verificationSent: "We've sent a verification code to your phone",
      resendCode: "Resend code in",
      seconds: "seconds",
      verify: "Verify",
      resetPassword: "Reset Password",
      sendResetCode: "Send Reset Code",
      backToLogin: "Back to Login",
      verificationCode: "Verification Code",
      newPassword: "New Password",
      confirmPassword: "Confirm Password",
      enterCode: "Enter verification code",
      enterNewPassword: "Enter new password",
      confirmNewPassword: "Confirm new password",
      back: "Back"
    },
    sw: {
      welcome: "Kazi Mashinani",
      tagline: "Kuunganisha Watalanta Vijijini na Fursa",
      login: "Ingia",
      register: "Jisajili",
      phoneNumber: "Nambari ya Simu",
      password: "Nenosiri",
      enterPassword: "Weka nenosiri lako",
      forgotPassword: "Umesahau Nenosiri?",
      fullName: "Jina Kamili",
      enterName: "Weka jina lako kamili",
      enterLocation: "Mahali Unapoishi",
      createPassword: "Tengeneza nenosiri",
      iAm: "Mimi ni",
      jobSeeker: "Mtafuta Kazi",
      employer: "Mwajiri",
      phoneVerification: "Uhakikisho wa Simu",
      verificationSent: "Tumetuma msimbo wa uthibitisho kwenye simu yako",
      resendCode: "Tuma tena msimbo baada ya",
      seconds: "sekunde",
      verify: "Thibitisha",
      resetPassword: "Weka Upya Nenosiri",
      sendResetCode: "Tuma Msimbo wa Kubadilisha",
      backToLogin: "Rudi kwenye Kuingia",
      verificationCode: "Msimbo wa Uthibitisho",
      newPassword: "Nenosiri Jipya",
      confirmPassword: "Thibitisha Nenosiri",
      enterCode: "Weka msimbo wa uthibitisho",
      enterNewPassword: "Weka nenosiri jipya",
      confirmNewPassword: "Thibitisha nenosiri jipya",
      back: "Rudi"
    }
  };

  const t = translations[currentLanguage];

  return (
    <>
      <Head>
        <title>Kazi Mashinani - Authentication</title>
        <meta name="description" content="Kazi Mashinani - Connecting Rural Talent with Opportunities" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>

      <div className={styles.languageSwitcher} onClick={toggleLanguage}>
        <span>{currentLanguage === 'en' ? '🇺🇸' : '🇰🇪'}</span>
        <span>{currentLanguage === 'en' ? 'English' : 'Kiswahili'}</span>
      </div>

      <div className={styles.authContainer}>
        <div className={styles.authHeader}>
          <h1>{t.welcome}</h1>
          <p>{t.tagline}</p>
        </div>

        <div className={styles.authTabs}>
          <div 
            className={`${styles.authTab} ${activeTab === 'login' ? styles.active : ''}`}
            onClick={() => switchTab('login')}
          >
            <span>{t.login}</span>
          </div>
          <div 
            className={`${styles.authTab} ${activeTab === 'register' ? styles.active : ''}`}
            onClick={() => switchTab('register')}
          >
            <span>{t.register}</span>
          </div>
        </div>

        <div className={styles.authContent}>
          {/* Login Form */}
          <form 
            className={`${styles.authForm} ${activeTab === 'login' ? styles.active : ''}`}
            onSubmit={handleLogin}
          >
            <div className="form-group">
              <label htmlFor="loginPhone">{t.phoneNumber}</label>
              <input
                type="tel"
                id="loginPhone"
                name="loginPhone"
                className="form-control"
                placeholder="07XXXXXXXX"
                value={formData.loginPhone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="loginPassword">{t.password}</label>
              <input
                type="password"
                id="loginPassword"
                name="loginPassword"
                className="form-control"
                placeholder={t.enterPassword}
                value={formData.loginPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn">
              {t.login}
            </button>

            <div className={styles.forgotPassword}>
              <a href="#" onClick={showForgotPassword}>
                {t.forgotPassword}
              </a>
            </div>
          </form>

          {/* Registration Form */}
          <form 
            className={`${styles.authForm} ${activeTab === 'register' ? styles.active : ''}`}
            onSubmit={handleRegistration}
          >
            <div className="form-group">
              <label htmlFor="registerName">{t.fullName}</label>
              <input
                type="text"
                id="registerName"
                name="registerName"
                className="form-control"
                placeholder={t.enterName}
                value={formData.registerName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPhone">{t.phoneNumber}</label>
              <input
                type="tel"
                id="registerPhone"
                name="registerPhone"
                className="form-control"
                placeholder="07XXXXXXXX"
                value={formData.registerPhone}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerLocation">{t.enterLocation}</label>
              <input
                type="text"
                id="registerLocation"
                name="registerLocation"
                className="form-control"
                placeholder={t.enterLocation}
                value={formData.registerLocation}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">{t.password}</label>
              <input
                type="password"
                id="registerPassword"
                name="registerPassword"
                className="form-control"
                placeholder={t.createPassword}
                value={formData.registerPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerRole">{t.iAm}</label>
              <select
                id="registerRole"
                name="registerRole"
                className="form-control"
                value={formData.registerRole}
                onChange={handleInputChange}
              >
                <option value="employee">{t.jobSeeker}</option>
                <option value="employer">{t.employer}</option>
              </select>
            </div>

            <button type="submit" className="btn">
              {t.register}
            </button>
          </form>

          {/* Verification Section */}
          <div className={`${styles.verificationSection} ${activeTab === 'verification' ? styles.active : ''}`}>
            <h3>{t.phoneVerification}</h3>
            <p>{t.verificationSent}</p>

            <div className={styles.verificationCode}>
              {verificationCode.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  className={styles.codeInput}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleVerificationCodeChange(index, e.target.value)}
                  onInput={(e) => moveToNext(e.target, index + 1)}
                />
              ))}
            </div>

            <div 
              className={`${styles.resendCode} ${isResendDisabled ? styles.disabled : ''}`}
              onClick={!isResendDisabled ? resendVerificationCode : undefined}
            >
              <span>{t.resendCode}</span>
              {isResendDisabled && (
                <>
                  <span className={styles.countdown}>{countdown}</span>
                  <span>{t.seconds}</span>
                </>
              )}
            </div>

            <button className="btn btn-secondary" onClick={verifyCode}>
              {t.verify}
            </button>
          </div>

          {/* Forgot Password Form */}
          <form 
            className={`${styles.authForm} ${activeTab === 'forgot' ? styles.active : ''}`}
            onSubmit={(e) => e.preventDefault()}
          >
            <h3>{t.resetPassword}</h3>

            <div className="form-group">
              <label htmlFor="forgotPhone">{t.phoneNumber}</label>
              <input
                type="tel"
                id="forgotPhone"
                name="forgotPhone"
                className="form-control"
                placeholder="07XXXXXXXX"
                value={formData.forgotPhone}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="button" className="btn btn-secondary" onClick={sendPasswordResetCode}>
              {t.sendResetCode}
            </button>

            <div className={styles.forgotPassword}>
              <a href="#" onClick={showLogin}>
                {t.backToLogin}
              </a>
            </div>
          </form>

          {/* Reset Password Form */}
          <form 
            className={`${styles.authForm} ${activeTab === 'reset' ? styles.active : ''}`}
            onSubmit={resetPassword}
          >
            <h3>{t.resetPassword}</h3>

            <div className="form-group">
              <label htmlFor="resetCode">{t.verificationCode}</label>
              <input
                type="text"
                id="resetCode"
                name="resetCode"
                className="form-control"
                placeholder={t.enterCode}
                value={formData.resetCode}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">{t.newPassword}</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                className="form-control"
                placeholder={t.enterNewPassword}
                value={formData.newPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">{t.confirmPassword}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="form-control"
                placeholder={t.confirmNewPassword}
                value={formData.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="btn btn-secondary">
              {t.resetPassword}
            </button>

            <div className={styles.forgotPassword}>
              <a href="#" onClick={showForgotPassword}>
                {t.back}
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
