import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  Mail,
  RotateCw,
  AlertCircle,
} from 'lucide-react';
import {
  verifyUserEmail,
  resendUserVerificationEmail,
} from './services/auth';

interface EmailVerificationProps {
  onNavigate: (path: string) => void;
}

const HERO_PIZZA_PHOTO =
  'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function EmailVerification({ onNavigate }: EmailVerificationProps) {
  // Retrieve email from URL query params, then sessionStorage, or fallback
  const [email, setEmail] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryEmail = searchParams.get('email');
      if (queryEmail) return queryEmail;
      const stored = sessionStorage.getItem('pizza_verification_email');
      if (stored) return stored;
    }
    return '';
  });

  const [loading, setLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [errorTitle, setErrorTitle] = useState<string | null>(null);
  const [tokenState, setTokenState] = useState<'idle' | 'verifying' | 'valid' | 'missing' | 'invalid' | 'expired' | 'already_used' | 'network_failure'>('idle');
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [isVerified, setIsVerified] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [customEmailInput, setCustomEmailInput] = useState('');

  // Handle countdown timer for resend cooldown
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

  // Check URL for verification token and call backend API
  useEffect(() => {
    let isMounted = true;

    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const queryToken = searchParams.get('token');
      const pathParts = window.location.pathname.split('/');
      const verifyIdx = pathParts.indexOf('verify-email');
      const pathToken = verifyIdx !== -1 && pathParts[verifyIdx + 1] ? pathParts[verifyIdx + 1] : null;
      const rawToken = queryToken || pathToken;

      // Detect empty or missing token query
      if (rawToken !== null && !rawToken.trim()) {
        setErrorTitle('Incomplete Link');
        setError('Verification link is missing or incomplete.');
        setTokenState('missing');
        return;
      }

      if (rawToken && rawToken.trim()) {
        const token = rawToken.trim();
        setLoading(true);
        setError(null);
        setErrorTitle(null);

        verifyUserEmail(token, email)
          .then((res) => {
            if (!isMounted) return;
            setLoading(false);
            if (res.success) {
              setIsVerified(true);
              setTokenState('valid');
            } else {
              setErrorTitle('Verification Notice');
              if (res.code === 'ALREADY_USED_TOKEN' || res.error?.includes('already been used')) {
                setTokenState('already_used');
                setError('This verification link has already been used. Please continue to login.');
              } else if (res.code === 'EXPIRED_TOKEN' || res.error?.includes('expired')) {
                setTokenState('expired');
                setError('This verification link has expired. Please request a new verification email.');
              } else if (res.code === 'MISSING_TOKEN' || res.error?.includes('missing')) {
                setTokenState('missing');
                setError('Verification link is missing or incomplete.');
              } else if (res.status === 0 || res.error?.includes('connect') || res.error?.includes('network')) {
                setTokenState('network_failure');
                setError("We couldn't verify your email right now. Please try again.");
              } else {
                setTokenState('invalid');
                setError('This verification link is invalid.');
              }
            }
          })
          .catch(() => {
            if (!isMounted) return;
            setLoading(false);
            setErrorTitle('Connection Problem');
            setTokenState('network_failure');
            setError("We couldn't verify your email right now. Please try again.");
          });
      }
    }

    return () => {
      isMounted = false;
    };
  }, [email]);

  // Format seconds to MM:SS
  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = async () => {
    const currentInput = isEditingEmail ? customEmailInput : (email || customEmailInput);
    const targetEmail = typeof currentInput === 'string' ? currentInput.trim() : '';

    if (!targetEmail) {
      setErrorTitle('Email Required');
      setError('Email address is required.');
      setIsEditingEmail(true);
      return;
    }

    const normalizedEmail = targetEmail.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setErrorTitle('Invalid Email');
      setError('Please enter a valid email address.');
      setIsEditingEmail(true);
      return;
    }

    setError(null);
    setErrorTitle(null);
    setSuccessBanner(null);
    setIsResending(true);

    try {
      const res = await resendUserVerificationEmail(normalizedEmail);
      if (res.success) {
        setEmail(normalizedEmail);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('pizza_verification_email', normalizedEmail);
        }
        setIsEditingEmail(false);
        setSuccessBanner(
          res.message || `If an unverified account exists for ${normalizedEmail}, a new verification link has been sent.`
        );
        setCooldown(60);
      } else {
        if (res.status === 429) {
          setErrorTitle('Rate Limit Reached');
          const waitTime = res.retryAfter && !isNaN(res.retryAfter) ? Math.max(res.retryAfter, 60) : 60;
          setCooldown(waitTime);
          setError('Too many attempts. Please wait before requesting another verification email.');
        } else {
          setErrorTitle('Unable to Send Email');
          setError(res.error || 'Unable to process the request. Please try again.');
        }
      }
    } catch {
      setErrorTitle('Network Error');
      setError('Unable to process the request. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleSaveCustomEmail = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = customEmailInput.trim();
    if (!clean) {
      setErrorTitle('Email Required');
      setError('Email address is required.');
      return;
    }
    const normalized = clean.toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized)) {
      setErrorTitle('Invalid Email');
      setError('Please enter a valid email address.');
      return;
    }
    setEmail(normalized);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pizza_verification_email', normalized);
    }
    setIsEditingEmail(false);
    setError(null);
    setErrorTitle(null);
  };

  return (
    <main className="forgot-page">
      <div className="forgot-page-inner">
        {/* Left Column: Form / Card */}
        <div className="forgot-card-wrapper">
          <div className="forgot-card verify-card" role="region" aria-label="Email verification">
            {isVerified ? (
              /* Success Verified State */
              <div className="success-state" role="status" aria-live="polite">
                <div className="success-icon-badge" aria-hidden="true">
                  <CheckCircle2 size={36} />
                </div>
                <h1 className="success-title">Email Verified Successfully!</h1>
                <p className="success-desc">
                  Your email has been verified. Your PizzaDelight account is now active and ready to
                  use.
                </p>
                <div className="success-actions">
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => onNavigate('/login')}
                  >
                    <span>Continue to Login</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="back-link-bottom"
                    onClick={() => onNavigate('/menu')}
                  >
                    <span>Browse Our Menu</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Verification State */
              <>
                {/* Envelope / Pizza Card Illustration */}
                <div className="verify-illustration-wrap" aria-hidden="true">
                  <svg
                    viewBox="0 0 200 190"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="verify-envelope-svg"
                  >
                    {/* Soft ambient glow */}
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

                    {/* Envelope Front Fold Lines (Left & Right triangles) */}
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

                {/* Title */}
                <h1 className="verify-title">Verify Your Email</h1>

                {/* Supporting Text with User Email */}
                <div className="verify-subtitle-group">
                  <p className="verify-subtitle">
                    Almost there! We&apos;ve sent a verification link to
                  </p>
                  {!isEditingEmail && email ? (
                    <p className="verify-email-display">
                      <span>{email}</span>
                      <button
                        type="button"
                        className="verify-change-email-btn"
                        onClick={() => {
                          setCustomEmailInput(email);
                          setIsEditingEmail(true);
                          setError(null);
                          setErrorTitle(null);
                          setSuccessBanner(null);
                        }}
                        aria-label="Change email address"
                      >
                        (change)
                      </button>
                    </p>
                  ) : (
                    <form onSubmit={handleSaveCustomEmail} className="verify-email-input-form">
                      <input
                        type="email"
                        placeholder="Enter your email"
                        value={customEmailInput}
                        onChange={(e) => {
                          setCustomEmailInput(e.target.value);
                          if (error) {
                            setError(null);
                            setErrorTitle(null);
                          }
                        }}
                        className="verify-inline-email-input"
                        autoFocus
                      />
                      <button type="submit" className="verify-inline-save-btn">
                        Save
                      </button>
                      {email && (
                        <button
                          type="button"
                          className="verify-inline-cancel-btn"
                          onClick={() => {
                            setIsEditingEmail(false);
                            if (error) {
                              setError(null);
                              setErrorTitle(null);
                            }
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </form>
                  )}
                </div>

                {/* Instructions */}
                <p className="verify-instructions">
                  Click the link in your email to activate your account and start your pizza journey
                  with PizzaDelight.
                </p>

                {/* API / Service Error Banner */}
                {error && (
                  <div className="forgot-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" aria-hidden="true" />
                    <div>
                      <strong>{errorTitle || 'Verification Notice'}</strong>
                      <p>{error}</p>
                      {tokenState === 'already_used' && (
                        <div style={{ marginTop: '8px' }}>
                          <button
                            type="button"
                            className="text-link"
                            style={{ fontWeight: 600, textDecoration: 'underline', color: 'inherit' }}
                            onClick={() => onNavigate('/login')}
                          >
                            Proceed to Login &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Feedback Banner */}
                {successBanner && (
                  <div className="verify-success-banner" role="status">
                    <CheckCircle2 size={18} className="text-brand" aria-hidden="true" />
                    <p>{successBanner}</p>
                  </div>
                )}

                {/* Notification / Help Card */}
                <div className="verify-help-card" role="note">
                  <div className="verify-help-icon" aria-hidden="true">
                    <Mail size={22} />
                  </div>
                  <div className="verify-help-content">
                    <strong>Didn&apos;t receive the email?</strong>
                    <p>Check your spam or junk folder. It might have ended up there.</p>
                  </div>
                </div>

                {/* Resend Verification Button */}
                <button
                  type="button"
                  className="submit-button verify-resend-btn"
                  onClick={handleResend}
                  disabled={loading || isResending || cooldown > 0}
                  aria-label="Resend Verification Email"
                >
                  {isResending ? (
                    <>
                      <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      <span>Sending email...</span>
                    </>
                  ) : (
                    <>
                      <RotateCw size={17} aria-hidden="true" />
                      <span>Resend Verification Email</span>
                    </>
                  )}
                </button>

                {/* Resend Cooldown Timer */}
                {cooldown > 0 ? (
                  <p className="verify-cooldown-text" aria-live="polite">
                    You can request a new link in{' '}
                    <strong className="text-brand">{formatCooldown(cooldown)}</strong>
                  </p>
                ) : (
                  <p className="verify-cooldown-text verify-cooldown-ready">
                    You can request a new link if needed.
                  </p>
                )}

                {/* Divider */}
                <hr className="forgot-divider" />

                {/* Support Area */}
                <div className="verify-support">
                  <span>Need help?</span>
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => onNavigate('/contact')}
                  >
                    <span>Contact our support team</span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </button>
                </div>

                {/* Back to Login Link */}
                <div className="verify-bottom-nav">
                  <button
                    type="button"
                    className="back-link-bottom"
                    onClick={() => onNavigate('/login')}
                  >
                    <ArrowLeft size={16} aria-hidden="true" />
                    <span>Back to Login</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Hero Food Photography & Accents */}
        <div className="forgot-visual" aria-hidden="true">
          <img
            src={HERO_PIZZA_PHOTO}
            alt="Artisan oven-baked pizza with fresh basil and tomatoes"
            className="forgot-visual-img"
          />
          {/* Subtle gradient vignette overlay */}
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
            {/* Hand-drawn curving arrow SVG pointing towards pizza */}
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

          {/* Floating Pill: Fresh Ingredients */}
          <div className="fresh-pill-badge">
            <div className="fresh-pill-icon">
              <Flame size={20} />
            </div>
            <div className="fresh-pill-text">
              <strong>Fresh Ingredients</strong>
              <small>Because great food starts with real ingredients.</small>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
