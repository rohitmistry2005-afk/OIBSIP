import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Loader2,
  Lock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  isSupabaseConfigured,
  supabase,
  updateUserPassword,
  checkRecoverySession,
} from './services/auth';

interface ResetPasswordProps {
  onNavigate: (path: string) => void;
}

const HERO_PIZZA_PHOTO =
  'https://images.pexels.com/photos/35759993/pexels-photo-35759993.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

type PasswordStrength = 'Weak' | 'Fair' | 'Good' | 'Strong';

interface StrengthResult {
  score: number; // 0 to 4
  label: PasswordStrength;
  colorClass: string;
}

function calculatePasswordStrength(password: string): StrengthResult {
  if (!password) {
    return { score: 0, label: 'Weak', colorClass: 'strength-weak' };
  }

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 10) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^a-zA-Z0-9]/.test(password)) points += 1;

  if (password.length < 8) {
    return { score: 1, label: 'Weak', colorClass: 'strength-weak' };
  }

  if (points <= 2) {
    return { score: 1, label: 'Weak', colorClass: 'strength-weak' };
  } else if (points === 3) {
    return { score: 2, label: 'Fair', colorClass: 'strength-fair' };
  } else if (points === 4) {
    return { score: 3, label: 'Good', colorClass: 'strength-good' };
  } else {
    return { score: 4, label: 'Strong', colorClass: 'strength-strong' };
  }
}

export function ResetPassword({ onNavigate }: ResetPasswordProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [hasValidSession, setHasValidSession] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Check for recovery session or tokens on mount
  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setIsCheckingSession(false);
          setHasValidSession(false);
        }
        return;
      }

      try {
        const hasSession = await checkRecoverySession();
        if (isMounted) {
          setHasValidSession(hasSession);
        }
      } catch {
        if (isMounted) {
          setHasValidSession(false);
        }
      } finally {
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    // Also listen for Supabase auth state changes (e.g. PASSWORD_RECOVERY event)
    let authSubscription: { unsubscribe: () => void } | null = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange((event, session) => {
        if (!isMounted) return;
        if (event === 'PASSWORD_RECOVERY' || (session && (event === 'SIGNED_IN' || event === 'USER_UPDATED'))) {
          setHasValidSession(true);
          setIsCheckingSession(false);
        }
      });
      authSubscription = data.subscription;
    }

    verifySession();

    return () => {
      isMounted = false;
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, []);

  const strength = calculatePasswordStrength(password);

  const validate = (): boolean => {
    let isValid = true;
    setPasswordError(null);
    setConfirmError(null);

    if (!password) {
      setPasswordError('Please enter a new password.');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmError('Please confirm your new password.');
      isValid = false;
    } else if (password && confirmPassword !== password) {
      setConfirmError('Passwords do not match. Please re-enter.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isSupabaseConfigured) {
      setError(
        'Authentication service is not configured. Please configure the required environment variables before resetting your password.'
      );
      return;
    }

    if (!hasValidSession) {
      setError('Your password reset link is invalid or has expired. Please request a new link.');
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);
    try {
      const result = await updateUserPassword(password);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error || 'Failed to update password. Please try again.');
      }
    } catch {
      setError('An unexpected network error occurred. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(null);
    if (error) setError(null);
    if (confirmError && confirmPassword && e.target.value === confirmPassword) {
      setConfirmError(null);
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmError) setConfirmError(null);
    if (error) setError(null);
  };

  return (
    <main className="forgot-page">
      <div className="forgot-page-inner">
        {/* Left Column: Form / Card */}
        <div className="forgot-card-wrapper">
          <div className="forgot-card" role="region" aria-label="Reset password form">
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

            {isCheckingSession ? (
              /* Initial Session Checking State */
              <div className="reset-checking-session" role="status" aria-live="polite">
                <Loader2 size={32} className="animate-spin text-brand" aria-hidden="true" />
                <p>Verifying recovery session...</p>
              </div>
            ) : !isSupabaseConfigured ? (
              /* Unconfigured State */
              <div className="unconfigured-state" role="alert">
                <div className="error-icon-badge" aria-hidden="true">
                  <AlertCircle size={36} />
                </div>
                <h2 className="error-title">Service Not Configured</h2>
                <p className="error-desc">
                  Authentication service is not configured. Please configure the required environment
                  variables (<code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code>)
                  before resetting your password.
                </p>
                <button
                  type="button"
                  className="submit-button"
                  onClick={() => onNavigate('/login')}
                >
                  <span>Back to Login</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            ) : !hasValidSession ? (
              /* Invalid or Expired Session State */
              <div className="expired-state" role="alert">
                <div className="error-icon-badge" aria-hidden="true">
                  <AlertCircle size={36} />
                </div>
                <h2 className="error-title">Link Expired or Invalid</h2>
                <p className="error-desc">
                  Your password reset link is invalid or has expired. For your security, password
                  reset links can only be used once.
                </p>
                <div className="expired-actions">
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => onNavigate('/forgot-password')}
                  >
                    <span>Request a New Reset Link</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="back-link-bottom"
                    onClick={() => onNavigate('/login')}
                  >
                    <span>Back to Login</span>
                  </button>
                </div>
              </div>
            ) : isSuccess ? (
              /* Success State */
              <div className="success-state" role="status" aria-live="polite">
                <div className="success-icon-badge" aria-hidden="true">
                  <CheckCircle2 size={36} />
                </div>
                <h2 className="success-title">Password Updated Successfully</h2>
                <p className="success-desc">
                  Your password has been changed. You can now log in to your PizzaDelight account with
                  your new password.
                </p>

                <div className="success-actions">
                  <button
                    type="button"
                    className="submit-button"
                    onClick={() => onNavigate('/login')}
                  >
                    <span>Back to Login</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              /* Main Reset Password Form */
              <>
                {/* Eyebrow & Headline */}
                <div className="forgot-header">
                  <p className="forgot-eyebrow">RESET YOUR PASSWORD</p>
                  <h1 className="forgot-title">
                    Create a
                    <br />
                    <span className="text-brand">New Password</span>
                  </h1>
                  <p className="forgot-description">
                    Enter your new password below. Make sure it&apos;s strong and unique to keep your
                    account secure.
                  </p>
                </div>

                {/* API / General Error Banner */}
                {error && (
                  <div className="forgot-error-banner" role="alert">
                    <AlertCircle size={18} className="error-icon" aria-hidden="true" />
                    <div>
                      <strong>Unable to reset password</strong>
                      <p>{error}</p>
                    </div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="forgot-form">
                  {/* New Password Field */}
                  <div className="form-group">
                    <label htmlFor="new-password" className="input-label">
                      New Password
                    </label>
                    <div
                      className={`input-container ${passwordError ? 'input-invalid' : ''} ${
                        loading ? 'input-disabled' : ''
                      }`}
                    >
                      <Lock size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={loading}
                        aria-invalid={!!passwordError}
                        aria-describedby={
                          passwordError ? 'new-password-error' : 'password-strength-desc'
                        }
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={0}
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>

                    {/* Password Strength Indicator */}
                    <div
                      className="password-strength-wrap"
                      id="password-strength-desc"
                      aria-live="polite"
                    >
                      <div className="strength-bars">
                        {[1, 2, 3, 4].map((barIndex) => {
                          const isActive = password.length > 0 && barIndex <= strength.score;
                          return (
                            <div
                              key={barIndex}
                              className={`strength-bar ${isActive ? strength.colorClass : ''}`}
                            />
                          );
                        })}
                      </div>
                      <span
                        className={`strength-label ${
                          password.length > 0 ? strength.colorClass : 'strength-muted'
                        }`}
                      >
                        {password.length > 0 ? strength.label : 'Weak'}
                      </span>
                    </div>

                    {passwordError ? (
                      <p id="new-password-error" className="field-validation-error" role="alert">
                        {passwordError}
                      </p>
                    ) : (
                      <p className="password-requirements">
                        Use at least 8 characters with a mix of letters, numbers and symbols.
                      </p>
                    )}
                  </div>

                  {/* Confirm New Password Field */}
                  <div className="form-group">
                    <label htmlFor="confirm-new-password" className="input-label">
                      Confirm New Password
                    </label>
                    <div
                      className={`input-container ${confirmError ? 'input-invalid' : ''} ${
                        loading ? 'input-disabled' : ''
                      }`}
                    >
                      <Lock size={18} className="field-icon" aria-hidden="true" />
                      <input
                        id="confirm-new-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete="new-password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={loading}
                        aria-invalid={!!confirmError}
                        aria-describedby={confirmError ? 'confirm-password-error' : undefined}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        aria-label={
                          showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'
                        }
                        tabIndex={0}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {confirmError && (
                      <p
                        id="confirm-password-error"
                        className="field-validation-error"
                        role="alert"
                      >
                        {confirmError}
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="submit-button"
                    disabled={loading}
                    aria-label="Reset Password"
                  >
                    {loading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      <>
                        <Lock size={16} aria-hidden="true" />
                        <span>Reset Password</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Security Card */}
                <div className="security-notice" role="note">
                  <div className="security-icon-box" aria-hidden="true">
                    <ShieldCheck size={18} />
                  </div>
                  <div className="security-notice-copy">
                    <strong>Your security is important to us.</strong>
                    <p>Use the secure password-reset link from your email to complete this process.</p>
                  </div>
                </div>

                {/* Divider */}
                <hr className="forgot-divider" />

                {/* Support Contact */}
                <div className="forgot-footer">
                  <p className="forgot-footer-text">Still having trouble?</p>
                  <button
                    type="button"
                    className="back-link-bottom"
                    onClick={() => onNavigate('/contact')}
                  >
                    <span>Contact our support team</span>
                    <ArrowRight size={15} aria-hidden="true" />
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
