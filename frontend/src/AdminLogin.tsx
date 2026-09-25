import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart2,
  Eye,
  EyeOff,
  FileText,
  Heart,
  Info,
  Loader2,
  Lock,
  Mail,
  Package,
  Shield,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import { loginAdmin } from './services/adminAuth';

interface AdminLoginProps {
  onNavigate: (path: string) => void;
}

export function AdminLogin({ onNavigate }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forgotNotice, setForgotNotice] = useState<string | null>(null);

  const validateEmail = (val: string): boolean => {
    const clean = val.trim();
    if (!clean) {
      setEmailError('Please enter your email address.');
      return false;
    }
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(clean)) {
      setEmailError('Please enter a valid email address.');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Please enter your password.');
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setForgotNotice(null);

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await loginAdmin(email, password);

      if (result.success) {
        onNavigate('/admin');
      } else {
        setAuthError(
          result.error || 'Authentication failed. Please verify your credentials.'
        );
      }
    } catch {
      setAuthError(
        'An unexpected error occurred. Please verify your network and credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setForgotNotice(
      'Admin password recovery is managed by IT/DevOps. Contact your system administrator.'
    );
  };

  return (
    <main className="admin-login-page">
      {/* 1. Left Visual / Brand Panel */}
      <section className="admin-login-visual" aria-label="Admin Portal Presentation">
        <div className="admin-visual-overlay" />
        <div className="admin-visual-inner">
          {/* Logo Header */}
          <div className="admin-visual-logo-wrap">
            <button
              type="button"
              className="logo admin-brand-logo"
              onClick={() => onNavigate('/')}
              aria-label="PizzaDelight home"
            >
              <span className="logo-mark" aria-hidden="true">◒</span>
              <span>
                <strong>PizzaDelight</strong>
                <small>GOOD PIZZA. HAPPIER PEOPLE.</small>
              </span>
            </button>
          </div>

          {/* Marketing Copy */}
          <div className="admin-visual-copy">
            <p className="admin-portal-eyebrow">— ADMIN PORTAL</p>
            <h1 className="admin-visual-headline">
              Manage Today.
              <br />
              <span className="admin-headline-accent">Serve a Better Tomorrow.</span>
            </h1>
            <p className="admin-visual-desc">
              Control menu, track orders, manage inventory and keep your pizza business
              running smoothly — all in one place.
            </p>

            {/* 4 Circular Feature Badges */}
            <div className="admin-visual-features-grid">
              <div className="admin-feature-item">
                <div className="admin-feature-icon-circle">
                  <BarChart2 size={20} aria-hidden="true" />
                </div>
                <span>Real-time Order Insights</span>
              </div>

              <div className="admin-feature-item">
                <div className="admin-feature-icon-circle">
                  <Package size={20} aria-hidden="true" />
                </div>
                <span>Manage Inventory</span>
              </div>

              <div className="admin-feature-item">
                <div className="admin-feature-icon-circle">
                  <FileText size={20} aria-hidden="true" />
                </div>
                <span>Update Menu &amp; Offers</span>
              </div>

              <div className="admin-feature-item">
                <div className="admin-feature-icon-circle">
                  <Users size={20} aria-hidden="true" />
                </div>
                <span>Happy Customers</span>
              </div>
            </div>
          </div>

          {/* Wooden Card Prop & Handwritten Message at Bottom */}
          <div className="admin-visual-footer-row">
            <div className="admin-handwritten-badge">
              <p className="admin-script-text">
                Great Food
                <br />
                Starts with
                <br />
                Great Management
              </p>
              <div className="admin-script-flourish">
                <Heart size={18} className="script-heart-icon" aria-hidden="true" />
                <span className="script-underline" aria-hidden="true" />
              </div>
            </div>

            <div className="admin-wood-prop-card" aria-hidden="true">
              <span>PIZZA</span>
              <span>PEOPLE</span>
              <span>MANAGE</span>
              <span>HAPPINESS</span>
              <span className="wood-heart">♥</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Right Admin Login Workspace */}
      <section className="admin-login-workspace" aria-label="Admin Login Workspace">
        {/* Top Navigation Row */}
        <div className="admin-workspace-topbar">
          <button
            type="button"
            className="back-website-btn"
            onClick={() => onNavigate('/')}
          >
            <ArrowLeft size={16} aria-hidden="true" />
            <span>Back to Website</span>
          </button>
        </div>

        {/* Main Centered Login Card */}
        <div className="admin-login-card-container">
          <div className="admin-login-card">
            {/* Top Lock Badge */}
            <div className="admin-card-lock-badge" aria-hidden="true">
              <Lock size={24} />
            </div>

            {/* Title & Subtitle */}
            <h2 className="admin-card-title">
              Admin <span className="title-accent">Login</span>
            </h2>
            <p className="admin-card-subtitle">
              Access your PizzaDelight admin dashboard
            </p>

            {/* Feedback / Error Alerts */}
            {authError && (
              <div className="admin-alert-banner error" role="alert">
                <Info size={16} className="alert-icon" aria-hidden="true" />
                <span>{authError}</span>
              </div>
            )}

            {forgotNotice && (
              <div className="admin-alert-banner info" role="status">
                <Info size={16} className="alert-icon" aria-hidden="true" />
                <span>{forgotNotice}</span>
              </div>
            )}

            {/* Login Form */}
            <form className="admin-login-form" onSubmit={handleSubmit} noValidate>
              {/* Email Address Field */}
              <div className="admin-form-group">
                <label htmlFor="admin-email" className="admin-form-label">
                  Email Address
                </label>
                <div
                  className={`admin-input-wrapper ${
                    emailError ? 'has-error' : ''
                  }`}
                >
                  <Mail size={18} className="input-leading-icon" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    className="admin-input-field"
                    placeholder="admin@pizzadelight.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError) validateEmail(e.target.value);
                    }}
                    onBlur={() => validateEmail(email)}
                    aria-invalid={Boolean(emailError)}
                    aria-describedby={emailError ? 'admin-email-error' : undefined}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                </div>
                {emailError && (
                  <p id="admin-email-error" className="admin-field-error" role="alert">
                    {emailError}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="admin-form-group">
                <label htmlFor="admin-password" className="admin-form-label">
                  Password
                </label>
                <div
                  className={`admin-input-wrapper ${
                    passwordError ? 'has-error' : ''
                  }`}
                >
                  <Lock size={18} className="input-leading-icon" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    className="admin-input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) validatePassword(e.target.value);
                    }}
                    onBlur={() => validatePassword(password)}
                    aria-invalid={Boolean(passwordError)}
                    aria-describedby={passwordError ? 'admin-password-error' : undefined}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? (
                      <EyeOff size={18} aria-hidden="true" />
                    ) : (
                      <Eye size={18} aria-hidden="true" />
                    )}
                  </button>
                </div>
                {passwordError && (
                  <p
                    id="admin-password-error"
                    className="admin-field-error"
                    role="alert"
                  >
                    {passwordError}
                  </p>
                )}
              </div>

              {/* Forgot Password Link */}
              <div className="admin-forgot-row">
                <button
                  type="button"
                  className="admin-forgot-btn"
                  onClick={handleForgotPassword}
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="admin-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="btn-spinner animate-spin" aria-hidden="true" />
                    <span>Verifying credentials...</span>
                  </>
                ) : (
                  <>
                    <Shield size={18} aria-hidden="true" />
                    <span>Login to Admin Panel</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </>
                )}
              </button>

              {/* OR Divider */}
              <div className="admin-or-divider" aria-hidden="true">
                <span>OR</span>
              </div>

              {/* Secondary CTA: Login as Customer */}
              <button
                type="button"
                className="customer-switch-btn"
                onClick={() => onNavigate('/login')}
              >
                <UserRound size={17} aria-hidden="true" />
                <span>Login as Customer Instead</span>
              </button>

              {/* Security Callout Box */}
              <div className="admin-security-callout">
                <ShieldCheck size={20} className="security-callout-icon" aria-hidden="true" />
                <div className="security-callout-copy">
                  <strong>Secure Access Only</strong>
                  <p>This area is restricted to authorized administrators only.</p>
                </div>
              </div>
            </form>
          </div>

          {/* Bottom Security / Trust Row */}
          <div className="admin-trust-row" aria-label="Security and encryption guarantees">
            <div className="trust-badge">
              <Lock size={15} aria-hidden="true" />
              <span>SSL Encrypted</span>
            </div>
            <span className="trust-pipe" aria-hidden="true">|</span>
            <div className="trust-badge">
              <Shield size={15} aria-hidden="true" />
              <span>Secure Access</span>
            </div>
            <span className="trust-pipe" aria-hidden="true">|</span>
            <div className="trust-badge">
              <Users size={15} aria-hidden="true" />
              <span>Authorized Personnel Only</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
