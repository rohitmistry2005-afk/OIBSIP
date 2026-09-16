import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Flame,
  Loader2,
  Lock,
  Mail,
  Send,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { requestPasswordReset } from './services/auth';

interface ForgotPasswordProps {
  onNavigate: (path: string) => void;
}

const HERO_PIZZA_PHOTO =
  'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export function ForgotPassword({ onNavigate }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (value: string): boolean => {
    const clean = value.trim();
    if (!clean) {
      setValidationError('Please enter your email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clean)) {
      setValidationError('Please enter a valid email address (e.g. you@example.com).');
      return false;
    }
    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validate(email)) {
      return;
    }

    setLoading(true);
    try {
      const result = await requestPasswordReset(email);
      if (result.success) {
        setSubmittedEmail(email.trim());
        setIsSuccess(true);
      } else {
        setError(result.error || 'Failed to send reset link. Please try again.');
      }
    } catch {
      setError('An unexpected network error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (validationError) {
      setValidationError(null);
    }
    if (error) {
      setError(null);
    }
  };

  const handleResend = async () => {
    if (!submittedEmail) return;
    setLoading(true);
    setError(null);
    try {
      const result = await requestPasswordReset(submittedEmail);
      if (!result.success) {
        setError(result.error || 'Failed to resend reset link.');
      }
    } catch {
      setError('Failed to resend reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="forgot-page">
      <div className="forgot-page-inner">
        {/* Left Column: Form / Card */}
        <div className="forgot-card-wrapper">
          <div className="forgot-card" role="region" aria-label="Forgot password form">
            {/* Top Back Link */}
            <button
              type="button"
              className="back-link-top"
              onClick={() => onNavigate('/login')}
              aria-label="Back to login"
            >
              <ArrowLeft size={16} aria-hidden="true" />
              <span>Back to Login</span>
            </button>

            {!isSuccess ? (
              <>
                {/* Eyebrow & Headline */}
                <div className="forgot-header">
                  <p className="forgot-eyebrow">FORGOT PASSWORD?</p>
                  <h1 className="forgot-title">
                    No Worries!
                    <br />
                    <span className="text-brand">We&apos;ve Got You.</span>
                  </h1>
                  <p className="forgot-description">
                    Enter your registered email address and we&apos;ll send you a link to reset your
                    password.
                  </p>
                </div>

                {/* API / General Error Banner */}
                {error && (
                  <div className="forgot-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" aria-hidden="true" />
                    <div>
                      <strong>Unable to send reset link</strong>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="forgot-form">
                  <div className="form-group">
                    <label htmlFor="reset-email" className="input-label">
                      Email Address
                    </label>
                    <div
                      className={`input-container ${validationError ? 'input-invalid' : ''} ${
                        loading ? 'input-disabled' : ''
                      }`}
                    >
                      <Mail size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="reset-email"
                        type="email"
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        disabled={loading}
                        aria-invalid={!!validationError}
                        aria-describedby={validationError ? 'email-error-msg' : undefined}
                      />
                    </div>
                    {validationError && (
                      <p id="email-error-msg" className="field-validation-error" role="alert">
                        {validationError}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                    aria-label="Send Reset Link"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        <span>Sending Reset Link...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} aria-hidden="true" />
                        <span>Send Reset Link</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Security Card */}
                <div className="security-notice" role="note">
                  <div className="security-icon-box" aria-hidden="true">
                    <Lock size={16} />
                  </div>
                  <p className="security-text">
                    For your security, we&apos;ll only send a reset link to the email address
                    associated with your account.
                  </p>
                </div>

                {/* Divider */}
                <hr className="forgot-divider" />

                {/* Bottom Back to Login */}
                <div className="forgot-footer">
                  <p className="forgot-footer-text">Remember your password?</p>
                  <button
                    type="button"
                    className="back-link-bottom"
                    onClick={() => onNavigate('/login')}
                  >
                    <span>Back to Login</span>
                    <ArrowRight size={15} aria-hidden="true" />
                  </button>
                </div>
              </>
            ) : (
              /* Success State */
              <div className="success-state" role="status" aria-live="polite">
                <div className="success-icon-badge" aria-hidden="true">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="success-title">Check Your Inbox</h2>
                <p className="success-desc">
                  We have sent a password reset link to:
                  <br />
                  <strong className="success-email">{submittedEmail}</strong>
                </p>
                <p className="success-tip">
                  Please check your inbox and spam folder. The password reset link will expire in 60
                  minutes for your security.
                </p>

                {error && (
                  <div className="forgot-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" aria-hidden="true" />
                    <div>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                <div className="success-actions">
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => onNavigate('/login')}
                  >
                    <span>Back to Login</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>

                  <button
                    type="button"
                    className="resend-link-button"
                    onClick={handleResend}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" aria-hidden="true" />
                        <span>Resending...</span>
                      </>
                    ) : (
                      <>
                        <RotateCw size={14} aria-hidden="true" />
                        <span>Didn&apos;t receive it? Resend link</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
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
