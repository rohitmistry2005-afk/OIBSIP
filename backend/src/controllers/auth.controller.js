import bcrypt from 'bcryptjs';
import { User } from '../models/user.model.js';
import { Admin } from '../models/admin.model.js';
import { createRandomToken, getTokenExpiry, hashToken } from '../utils/tokens.js';
import { signAuthToken } from '../utils/jwt.js';
import { sendOtpEmail, sendPasswordResetEmail, sendVerificationEmail } from '../services/email.service.js';
import {
  canResendOtp,
  generateOtp,
  getOtpExpiry,
  hashOtp,
  isOtpExpired,
  MAX_OTP_ATTEMPTS,
  verifyOtpHash,
} from '../services/otp.service.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SALT_ROUNDS = 12;

function safeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    emailVerificationMethod: user.emailVerificationMethod || 'otp',
  };
}

function safeAdmin(admin) {
  return { id: admin._id, name: admin.name, email: admin.email, role: admin.role };
}

export async function register(req, res) {
  const { name, email, password } = req.body || {};
  const trimmedName = typeof name === 'string' ? name.trim() : '';
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  const normalizedEmail = trimmedEmail.toLowerCase();

  if (!trimmedName || !trimmedEmail || !EMAIL_REGEX.test(normalizedEmail) || !password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ success: false, message: 'Name, valid email and password (minimum 8 characters) are required' });
  }

  const existing = await User.findOne({ email: normalizedEmail });
  if (existing) return res.status(409).json({ success: false, message: 'An account with this email already exists' });

  const rawOtp = generateOtp();
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    isEmailVerified: false,
    emailVerificationMethod: 'otp',
    emailOtpHash: hashOtp(rawOtp),
    emailOtpExpiresAt: getOtpExpiry(10),
    emailOtpAttempts: 0,
    emailOtpLastSentAt: new Date(),
    verificationToken: null,
    verificationTokenExpiresAt: null,
  });

  try {
    await sendOtpEmail({ email: user.email, name: user.name, otp: rawOtp });
  } catch (emailErr) {
    console.error('[auth:register] Failed to dispatch verification OTP email:', emailErr);
  }

  res.status(201).json({
    success: true,
    message: 'Registration successful. Check your email for your 6-digit verification code.',
    requiresVerification: true,
    verificationMethod: 'otp',
    email: user.email,
    user: safeUser(user),
  });
}

export async function verifyEmail(req, res) {
  const token = req.params.token;
  const trimmedToken = typeof token === 'string' ? token.trim() : '';

  if (!trimmedToken) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_TOKEN',
      message: 'Verification link is missing or incomplete.',
    });
  }

  const tokenHash = hashToken(trimmedToken);
  const user = await User.findOne({ verificationToken: tokenHash });

  if (!user) {
    // Check if query contains email to distinguish an already-used token for a verified account
    const queryEmail = typeof req.query.email === 'string' ? req.query.email.trim().toLowerCase() : '';
    if (queryEmail) {
      const existingUser = await User.findOne({ email: queryEmail });
      if (existingUser && existingUser.isEmailVerified) {
        return res.status(400).json({
          success: false,
          code: 'ALREADY_USED_TOKEN',
          message: 'This verification link has already been used. Please continue to login.',
        });
      }
    }

    return res.status(400).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'This verification link is invalid.',
    });
  }

  if (user.verificationTokenExpiresAt && user.verificationTokenExpiresAt <= new Date()) {
    return res.status(400).json({
      success: false,
      code: 'EXPIRED_TOKEN',
      message: 'This verification link has expired. Please request a new verification email.',
    });
  }

  user.isEmailVerified = true;
  user.verificationToken = null;
  user.verificationTokenExpiresAt = null;
  await user.save();

  res.json({ success: true, message: 'Email verified successfully.' });
}

export async function resendVerification(req, res) {
  const { email } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Anti-enumeration: Return generic success if user does not exist or is already verified
  if (!user || user.isEmailVerified) {
    return res.json({
      success: true,
      message: 'If an unverified account exists for this email, a new verification link has been sent.',
    });
  }

  const rawToken = createRandomToken();
  user.verificationToken = hashToken(rawToken);
  user.verificationTokenExpiresAt = getTokenExpiry(30);
  await user.save();

  try {
    await sendVerificationEmail({ email: user.email, name: user.name, token: rawToken });
  } catch (emailErr) {
    console.error('[auth:resend] Failed to send verification email:', emailErr);
    return res.status(500).json({
      success: false,
      message: 'Unable to send verification email. Please try again later.',
    });
  }

  res.json({
    success: true,
    message: 'If an unverified account exists for this email, a new verification link has been sent.',
  });
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: 'Password is required.' });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Please verify your email address before logging in.',
      requiresVerification: true,
      email: user.email,
    });
  }

  const token = signAuthToken({ id: user._id.toString(), role: 'user', type: 'user' });
  res.json({
    success: true,
    message: 'Login successful.',
    token,
    user: safeUser(user),
  });
}

export async function logout(req, res) {
  res.json({
    success: true,
    message: 'Logged out successfully.',
  });
}

export async function me(req, res) {
  res.json({ success: true, user: safeUser(req.user) });
}

export async function forgotPassword(req, res) {
  const { email } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return res.status(400).json({ success: false, message: 'Email address is required.' });
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }

  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const rawToken = createRandomToken();
    user.resetToken = hashToken(rawToken);
    user.resetTokenExpiresAt = getTokenExpiry(30);
    await user.save();
    try {
      await sendPasswordResetEmail({ email: user.email, name: user.name, token: rawToken });
    } catch (emailErr) {
      console.error('[auth:forgotPassword] Failed to send password reset email:', emailErr);
    }
  }

  res.json({ success: true, message: 'If an account exists for that email, a password reset link has been sent.' });
}

export async function resetPassword(req, res) {
  const rawToken = req.params.token || req.body?.token;
  const trimmedToken = typeof rawToken === 'string' ? rawToken.trim() : '';

  if (!trimmedToken) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_TOKEN',
      message: 'Password reset link is incomplete.',
    });
  }

  const { password, confirmPassword } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      code: 'MISSING_PASSWORD',
      message: 'Password is required.',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      code: 'PASSWORD_TOO_SHORT',
      message: 'Password must be at least 8 characters long.',
    });
  }

  if (confirmPassword !== undefined && password !== confirmPassword) {
    return res.status(400).json({
      success: false,
      code: 'PASSWORD_MISMATCH',
      message: 'Passwords do not match.',
    });
  }

  const tokenHash = hashToken(trimmedToken);
  const user = await User.findOne({ resetToken: tokenHash });

  if (!user) {
    const queryEmail = typeof req.query.email === 'string'
      ? req.query.email.trim().toLowerCase()
      : typeof req.body?.email === 'string'
      ? req.body.email.trim().toLowerCase()
      : '';
    if (queryEmail) {
      const existingUser = await User.findOne({ email: queryEmail });
      if (existingUser && !existingUser.resetToken) {
        return res.status(400).json({
          success: false,
          code: 'ALREADY_USED_TOKEN',
          message: 'This password reset link has already been used.',
        });
      }
    }

    return res.status(400).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'This password reset link is invalid.',
    });
  }

  if (user.resetTokenExpiresAt && user.resetTokenExpiresAt <= new Date()) {
    return res.status(400).json({
      success: false,
      code: 'EXPIRED_TOKEN',
      message: 'This password reset link has expired. Please request a new one.',
    });
  }

  user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  user.resetToken = null;
  user.resetTokenExpiresAt = null;
  await user.save();

  res.json({
    success: true,
    message: 'Password reset successfully. You can now log in with your new password.',
  });
}

export async function adminLogin(req, res) {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email: (email || '').toLowerCase().trim() });
  if (!admin || !(await bcrypt.compare(password || '', admin.passwordHash))) {
    return res.status(401).json({ success: false, message: 'Invalid admin credentials' });
  }

  const token = signAuthToken({ id: admin._id.toString(), role: 'admin', type: 'admin' });
  res.json({ success: true, token, admin: safeAdmin(admin) });
}

export async function verifyOtp(req, res) {
  const { email, otp } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_EMAIL',
      message: 'Email address is required.',
    });
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_EMAIL',
      message: 'A valid email address is required.',
    });
  }

  const trimmedOtp = typeof otp === 'string' || typeof otp === 'number' ? String(otp).trim() : '';
  if (!trimmedOtp) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_OTP',
      message: 'Verification code is required.',
    });
  }

  if (!/^\d{6}$/.test(trimmedOtp)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_OTP_FORMAT',
      message: 'Verification code must be exactly 6 digits.',
    });
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_OTP',
      message: 'Invalid verification code or email address.',
    });
  }

  if (user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      code: 'ALREADY_VERIFIED',
      message: 'Email is already verified. Please continue to login.',
      alreadyVerified: true,
    });
  }

  if (!user.emailOtpHash) {
    return res.status(400).json({
      success: false,
      code: 'NO_OTP_PENDING',
      message: 'No verification code found. Please request a new code.',
    });
  }

  if (isOtpExpired(user.emailOtpExpiresAt)) {
    return res.status(400).json({
      success: false,
      code: 'EXPIRED_OTP',
      message: 'This verification code has expired. Please request a new code.',
    });
  }

  if ((user.emailOtpAttempts || 0) >= MAX_OTP_ATTEMPTS) {
    user.emailOtpHash = null;
    user.emailOtpExpiresAt = null;
    await user.save();
    return res.status(400).json({
      success: false,
      code: 'MAX_ATTEMPTS_EXCEEDED',
      message: 'Maximum verification attempts exceeded. Please request a new code.',
    });
  }

  const isMatch = verifyOtpHash(trimmedOtp, user.emailOtpHash);
  if (!isMatch) {
    user.emailOtpAttempts = (user.emailOtpAttempts || 0) + 1;
    const attemptsRemaining = Math.max(0, MAX_OTP_ATTEMPTS - user.emailOtpAttempts);
    if (user.emailOtpAttempts >= MAX_OTP_ATTEMPTS) {
      user.emailOtpHash = null;
      user.emailOtpExpiresAt = null;
    }
    await user.save();

    return res.status(400).json({
      success: false,
      code: 'INVALID_OTP',
      message: 'Invalid verification code. Please check the code and try again.',
      attemptsRemaining,
    });
  }

  // OTP verified successfully
  user.isEmailVerified = true;
  user.emailOtpHash = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.emailVerificationMethod = 'otp';
  user.verificationToken = null;
  user.verificationTokenExpiresAt = null;
  await user.save();

  return res.status(200).json({
    success: true,
    message: 'Email verified successfully. You can now continue to login.',
  });
}

export async function resendOtp(req, res) {
  const { email } = req.body || {};
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';

  if (!trimmedEmail) {
    return res.status(400).json({
      success: false,
      code: 'MISSING_EMAIL',
      message: 'Email address is required.',
    });
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return res.status(400).json({
      success: false,
      code: 'INVALID_EMAIL',
      message: 'A valid email address is required.',
    });
  }

  const user = await User.findOne({ email: normalizedEmail });

  // Anti-enumeration: If user does not exist or is already verified, return generic success
  if (!user || user.isEmailVerified) {
    return res.status(200).json({
      success: true,
      message: 'If an unverified account exists for this email, a new verification code has been sent.',
    });
  }

  // Enforce server-side 60-second cooldown
  const cooldownCheck = canResendOtp(user.emailOtpLastSentAt, 60);
  if (!cooldownCheck.allowed) {
    return res.status(429).json({
      success: false,
      code: 'RESEND_COOLDOWN',
      message: `Please wait ${cooldownCheck.retryAfter} seconds before requesting a new code.`,
      retryAfter: cooldownCheck.retryAfter,
    });
  }

  const rawOtp = generateOtp();
  user.emailOtpHash = hashOtp(rawOtp);
  user.emailOtpExpiresAt = getOtpExpiry(10);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  user.emailVerificationMethod = 'otp';
  await user.save();

  try {
    await sendOtpEmail({ email: user.email, name: user.name, otp: rawOtp });
  } catch (emailErr) {
    console.error('[auth:resendOtp] Failed to dispatch OTP email:', emailErr);
    return res.status(500).json({
      success: false,
      message: 'Unable to send verification code. Please try again later.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'If an unverified account exists for this email, a new verification code has been sent.',
  });
}

