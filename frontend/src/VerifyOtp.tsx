import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Mail,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { verifyEmailOtp, resendEmailOtp } from './services/authApi';
import { sanitizeErrorMessage } from './services/auth';

interface VerifyOtpProps {
  onNavigate: (path: string) => void;
  initialEmail?: string;
}

const HERO_PIZZA_PHOTO =
  'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function VerifyOtp({ onNavigate, initialEmail }: VerifyOtpProps) {
  // Read email from props, query params (?email=...), or sessionStorage fallback
  const [email] = useState<string>(() => {
    if (initialEmail && initialEmail.trim()) return initialEmail.trim();
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryEmail = searchParams.get('email');
      if (queryEmail && queryEmail.trim()) return queryEmail.trim();
      const stored =
        sessionStorage.getItem('pizza_verification_email') ||
        sessionStorage.getItem('pizzadelight_registered_email');
      if (stored && stored.trim()) return stored.trim();
    }
    return '';
  });

  // 6 individual OTP digits
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Resend cooldown timer in seconds (defaults to 60s matching backend cooldown)
  const [cooldown, setCooldown] = useState<number>(60);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const stateParam = new URLSearchParams(window.location.search).get('state');
      if (stateParam === 'invalid') return 'That code is incorrect. Please try again.';
      if (stateParam === 'expired') return 'This code has expired. Please request a new code.';
      if (stateParam === 'rate_limited') return 'Please wait before requesting another code.';
      if (stateParam === 'network') return "We couldn't verify your email right now. Please try again.";
    }
    return null;
  });
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const [isVerified, setIsVerified] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('state') === 'success';
    }
    return false;
  });

  // Focus the first input on initial mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Mask email utility (e.g. r•••••••@gmail.com)
  const maskEmail = (raw: string): string => {
    const clean = raw.trim();
    if (!clean || !clean.includes('@')) {
      return clean ? clean : 'No email provided';
    }
    const [name, domain] = clean.split('@');
    if (!name) return `•••••••@${domain || 'example.com'}`;
    const firstChar = name[0];
    return `${firstChar}•••••••@${domain}`;
  };

  // Format cooldown seconds to 00:ss format
  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
    const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${paddedMins}:${paddedSecs}`;
  };

  // Handle single digit input
  const handleInputChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (errorMessage) setErrorMessage(null);
    if (successNotice) setSuccessNotice(null);

    const value = e.target.value;
    const digitsOnly = value.replace(/\D/g, '');

    if (!digitsOnly) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const lastDigit = digitsOnly[digitsOnly.length - 1];
    const newOtp = [...otp];
    newOtp[index] = lastDigit;
    setOtp(newOtp);

    // Auto-advance focus to next input
    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Map backend responses to safe UI messages
  const mapErrorMessage = (code?: string, status?: number, rawMessage?: string): string => {
    if (code === 'INVALID_OTP' || code === 'INVALID_OTP_FORMAT') {
      return 'That code is incorrect. Please try again.';
    }
    if (code === 'EXPIRED_OTP') {
      return 'This code has expired. Please request a new code.';
    }
    if (code === 'MAX_ATTEMPTS_EXCEEDED') {
      return 'Too many incorrect attempts. Please request a new code.';
    }
    if (code === 'NO_OTP_PENDING') {
      return 'No active verification code was found. Please request a new code.';
    }
    if (code === 'ALREADY_VERIFIED') {
      return 'Your email is already verified. Please continue to login.';
    }
    if (code === 'RESEND_COOLDOWN' || code === 'OTP_RESEND_COOLDOWN' || status === 429) {
      return 'Please wait before requesting another code.';
    }
    if (code === 'MISSING_EMAIL' || code === 'INVALID_EMAIL') {
      return 'A valid email address is required.';
    }
    if (code === 'MISSING_OTP') {
      return 'Please enter all 6 digits of your verification code.';
    }
    if (status === 0 || status === 500 || status === 502 || status === 503) {
      return "We couldn't verify your email right now. Please try again.";
    }
    return sanitizeErrorMessage(rawMessage, "We couldn't verify your email right now. Please try again.");
  };

  const isComplete = otp.every((digit) => digit.trim().length === 1);

  // Submit 6-digit OTP verification
  const handleVerifyOtp = async () => {
    if (loading || resending) return;
    if (!email) {
      setErrorMessage('No email address provided. Please return to registration and try again.');
      return;
    }
    const enteredOtp = otp.join('').trim();
    if (enteredOtp.length !== 6) {
      setErrorMessage('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await verifyEmailOtp(email.trim().toLowerCase(), enteredOtp);

      if (res.success) {
        setIsVerified(true);
      } else {
        const errorText = mapErrorMessage(res.code, res.status, res.error || res.message);
        setErrorMessage(errorText);

        if (
          res.code === 'INVALID_OTP' ||
          res.code === 'INVALID_OTP_FORMAT' ||
          res.code === 'EXPIRED_OTP' ||
          res.code === 'MAX_ATTEMPTS_EXCEEDED'
        ) {
          setOtp(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }

        if (res.code === 'ALREADY_VERIFIED') {
          setIsVerified(true);
        }
      }
    } catch (err: unknown) {
      const errorText = sanitizeErrorMessage(
        err instanceof Error ? err.message : null,
        "We couldn't verify your email right now. Please try again."
      );
      setErrorMessage(errorText);
    } finally {
      setLoading(false);
    }
  };

  // Handle backspace, delete, enter, and arrow keys
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (isComplete && !loading && email) {
        handleVerifyOtp();
      }
      return;
    }

    if (e.key === 'Backspace') {
      if (errorMessage) setErrorMessage(null);
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste of up to 6 digits
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (errorMessage) setErrorMessage(null);
    if (successNotice) setSuccessNotice(null);

    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasteData[i] || '';
    }
    setOtp(newOtp);

    const focusTarget = Math.min(pasteData.length, 5);
    inputRefs.current[focusTarget]?.focus();
  };

  // Connect real Resend OTP API
  const handleResendClick = async () => {
    if (cooldown > 0 || resending || loading) return;
    if (!email) {
      setErrorMessage('No email address provided. Please return to registration and try again.');
      return;
    }

    setResending(true);
    setErrorMessage(null);
    setSuccessNotice(null);

    try {
      const res = await resendEmailOtp(email.trim().toLowerCase());

      if (res.success) {
        setOtp(['', '', '', '', '', '']);
        setCooldown(60);
        setSuccessNotice(
          res.message || 'If an unverified account exists for this email, a new verification code has been sent.'
        );
        inputRefs.current[0]?.focus();
      } else {
        if (res.status === 429 || res.code === 'RESEND_COOLDOWN') {
          const waitTime = res.retryAfter && res.retryAfter > 0 ? res.retryAfter : 60;
          setCooldown(waitTime);
          setErrorMessage('Please wait before requesting another code.');
        } else {
          setErrorMessage(
            sanitizeErrorMessage(
              res.error || res.message,
              "We couldn't send a new verification code right now. Please try again."
            )
          );
        }
      }
    } catch (err: unknown) {
      setErrorMessage(
        sanitizeErrorMessage(
          err instanceof Error ? err.message : null,
          "We couldn't send a new verification code right now. Please try again."
        )
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <main className="forgot-page otp-page">
      <div className="forgot-page-inner">
        {/* Left Column: Verification Card */}
        <div className="forgot-card-wrapper otp-card-wrapper">
          <div className="otp-card" role="region" aria-label="Email verification form">
            {isVerified ? (
              /* Prepared Success State (For Step 4 Integration) */
              <div className="otp-success-state" role="status">
                <div className="otp-success-icon-badge" aria-hidden="true">
                  <CheckCircle2 size={36} />
                </div>
                <h1 className="otp-title">Email Verified Successfully</h1>
                <p className="otp-subtitle" style={{ maxWidth: 360, margin: '0 auto 24px' }}>
                  Your email has been verified. You can now continue to login and enjoy fresh handcrafted pizzas!
                </p>
                <button
                  type="button"
                  className="otp-verify-btn"
                  onClick={() => {
                    setIsVerified(false);
                    onNavigate('/login');
                  }}
                  aria-label="Continue to Login"
                >
                  <span>Continue to Login</span>
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </div>
            ) : (
              /* Standard OTP Entry View matching Reference Image */
              <>
                {/* Envelope + Pizza Slice Illustration */}
                <div className="otp-illustration-wrap" aria-hidden="true">
                  <svg
                    viewBox="0 0 200 190"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="otp-envelope-svg"
                  >
                    {/* Ambient warm circle halo */}
                    <circle cx="100" cy="100" r="78" fill="#fdf4e9" />

                    {/* Radiating decorative spark dashes */}
                    {/* Top Left rays */}
                    <path
                      d="M 52 46 L 40 34"
                      stroke="#c83a24"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 38 58 L 26 56"
                      stroke="#c83a24"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    {/* Top Right rays */}
                    <path
                      d="M 148 46 L 160 34"
                      stroke="#c83a24"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 162 58 L 174 56"
                      stroke="#c83a24"
                      strokeWidth="3.2"
                      strokeLinecap="round"
                    />

                    {/* Envelope Open Back Flap */}
                    <path
                      d="M 36 100 L 100 46 L 164 100 Z"
                      fill="#edd8c4"
                      stroke="#e2c8af"
                      strokeWidth="1.5"
                    />

                    {/* Letter Card Emerging from Envelope */}
                    <g filter="drop-shadow(0 4px 10px rgba(70, 30, 15, 0.08))">
                      <rect
                        x="52"
                        y="52"
                        width="96"
                        height="86"
                        rx="9"
                        fill="#ffffff"
                        stroke="#edd9c7"
                        strokeWidth="1.5"
                      />

                      {/* Pizza Slice Icon Motif on the Letter Card */}
                      <g transform="translate(86, 74)">
                        {/* Golden crust */}
                        <path
                          d="M -16 6 C -6 2, 6 2, 16 6 C 18 3, 14 -1, 10 -2 C 2 -4, -4 -4, -10 -2 C -14 -1, -18 3, -16 6 Z"
                          fill="#d97724"
                        />
                        {/* Pizza slice body */}
                        <path
                          d="M -16 6 C -5 5, 5 5, 16 6 L 0 34 Z"
                          fill="#c83a24"
                        />
                        {/* Melted Cheese drip */}
                        <path
                          d="M -14 7 C -8 13, -3 10, 0 14 C 3 10, 8 13, 14 7 L 0 33 Z"
                          fill="#f8ba43"
                          opacity="0.95"
                        />
                        {/* Toppings (basil dot & pepperoni) */}
                        <circle cx="-3" cy="12" r="2.4" fill="#a82312" />
                        <circle cx="4" cy="18" r="2.2" fill="#a82312" />
                        <circle cx="-1" cy="22" r="1.8" fill="#2d6a4f" />
                      </g>
                    </g>

                    {/* Envelope Front Base Body */}
                    <rect
                      x="34"
                      y="94"
                      width="132"
                      height="74"
                      rx="8"
                      fill="#faede0"
                      stroke="#e2cbb5"
                      strokeWidth="1.5"
                    />

                    {/* Envelope Front Fold Lines */}
                    <path
                      d="M 34 94 L 100 134 L 34 168 Z"
                      fill="#f2dfcd"
                      stroke="#dec5ad"
                      strokeWidth="1"
                    />
                    <path
                      d="M 166 94 L 100 134 L 166 168 Z"
                      fill="#f0dcc9"
                      stroke="#dec5ad"
                      strokeWidth="1"
                    />

                    {/* Envelope Bottom Front Flap */}
                    <path
                      d="M 34 168 L 100 120 L 166 168 Z"
                      fill="#faede0"
                      stroke="#dec5ad"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Heading */}
                <h1 className="otp-title">
                  Verify <span className="text-brand">Your Email</span>
                </h1>

                {/* Subtitle */}
                <p className="otp-subtitle">
                  We&apos;ve sent a 6-digit verification code to
                </p>

                {/* Masked Email Badge */}
                <div className="otp-email-badge">
                  <Mail size={16} className="text-brand" aria-hidden="true" />
                  <span>{email ? maskEmail(email) : 'No email provided'}</span>
                </div>

                {/* Email Missing Notice */}
                {!email && (
                  <div className="otp-error-banner" role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>No email address provided. Please return to registration and try again.</span>
                  </div>
                )}

                {/* Error Banner */}
                {errorMessage && (
                  <div className="otp-error-banner" role="alert">
                    <AlertCircle size={16} aria-hidden="true" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Success Notice Banner (e.g. on Resend) */}
                {successNotice && (
                  <div className="otp-success-banner" role="status">
                    <CheckCircle2 size={16} aria-hidden="true" />
                    <span>{successNotice}</span>
                  </div>
                )}

                {/* 6-Digit OTP Inputs */}
                <div
                  className="otp-inputs-row"
                  role="group"
                  aria-label="6-digit verification code"
                >
                  {otp.map((digit, idx) => {
                    const isCurrentActive = activeIndex === idx;
                    const showPlaceholder = !digit && !isCurrentActive;

                    return (
                      <input
                        key={idx}
                        ref={(el) => {
                          inputRefs.current[idx] = el;
                        }}
                        id={`otp-digit-${idx + 1}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        autoComplete="one-time-code"
                        aria-label={`Verification code digit ${idx + 1} of 6`}
                        value={digit}
                        placeholder={showPlaceholder ? '0' : ''}
                        disabled={loading || !email}
                        className={`otp-digit-input ${isCurrentActive ? 'active' : ''}`}
                        onChange={(e) => handleInputChange(idx, e)}
                        onKeyDown={(e) => handleKeyDown(idx, e)}
                        onPaste={handlePaste}
                        onFocus={(e) => {
                          setActiveIndex(idx);
                          e.target.select();
                        }}
                      />
                    );
                  })}
                </div>

                {/* Primary Action Button: Verify Email */}
                <button
                  type="button"
                  className="otp-verify-btn"
                  disabled={!isComplete || loading || !email}
                  aria-label="Verify Email"
                  onClick={handleVerifyOtp}
                >
                  {loading ? (
                    <>
                      <Loader2 size={17} className="animate-spin" aria-hidden="true" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <span>Verify Email</span>
                      <ArrowRight size={17} aria-hidden="true" />
                    </>
                  )}
                </button>

                {/* Expiration Note */}
                <div className="otp-expire-note">
                  <Clock3 size={15} aria-hidden="true" />
                  <span>
                    This code will expire in <strong>10 minutes</strong>.
                  </span>
                </div>

                {/* Resend OTP Container */}
                <div className="otp-resend-box" role="region" aria-label="Resend verification code">
                  <button
                    type="button"
                    className="otp-resend-action-btn"
                    onClick={handleResendClick}
                    disabled={cooldown > 0 || resending || loading || !email}
                    aria-label="Resend OTP"
                  >
                    {resending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                        <span>Sending code...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw size={16} aria-hidden="true" />
                        <span>Resend OTP</span>
                      </>
                    )}
                  </button>

                  <p className="otp-cooldown-text" aria-live="polite">
                    {cooldown > 0 ? (
                      <>
                        Resend available in{' '}
                        <strong className="text-brand">{formatCooldown(cooldown)}</strong>
                      </>
                    ) : (
                      <>Didn&apos;t receive code? You can resend now.</>
                    )}
                  </p>
                </div>

                {/* Change Email Navigation Link */}
                <button
                  type="button"
                  className="otp-change-email-btn"
                  onClick={() => onNavigate('/register')}
                  aria-label="Change Email"
                >
                  <ArrowLeft size={15} aria-hidden="true" />
                  <span>Change Email</span>
                </button>

                {/* Support Section */}
                <div className="otp-support-row">
                  <span>Need help?</span>
                  <button
                    type="button"
                    className="otp-support-link"
                    onClick={() => onNavigate('/contact')}
                    aria-label="Contact our support team"
                  >
                    <span>Contact our support team</span>
                    <ArrowRight size={13} aria-hidden="true" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Hero Pizza Food Photography with Handwritten Message */}
        <div className="forgot-visual" aria-hidden="true">
          <img
            src={HERO_PIZZA_PHOTO}
            alt="Artisan oven-baked pizza with fresh melted mozzarella cheese and basil"
            className="forgot-visual-img"
          />
          {/* Subtle warm gradient vignette overlay */}
          <div className="forgot-visual-overlay" />

          {/* Handwritten Style Message with Heart and Curved Arrow */}
          <div className="script-badge">
            <span className="script-line-1">Good</span>
            <span className="script-line-2">Pizza</span>
            <span className="script-line-3">Brighter</span>
            <div className="script-line-4">
              <span>Days</span>
              {/* Hand-drawn heart SVG */}
              <svg
                className="script-heart"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </div>
            {/* Hand-drawn curving chalk arrow SVG pointing towards the pizza */}
            <svg
              className="script-arrow"
              viewBox="0 0 60 45"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M8 8 C 22 28, 42 22, 50 32" />
              <path d="M42 33 L 51 32 L 48 23" />
            </svg>
          </div>
        </div>
      </div>
    </main>
  );
}
