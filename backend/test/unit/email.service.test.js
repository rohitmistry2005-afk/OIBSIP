import test from 'node:test';
import assert from 'node:assert/strict';
import nodemailer from 'nodemailer';
import { env, formatSenderAddress } from '../../src/config/env.js';
import {
  sendOtpEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendLowStockEmail,
} from '../../src/services/email.service.js';

// =========================================================================
// Unit Tests: Email Sender Configuration & Brevo / EMAIL_FROM Compliance
// =========================================================================

test('formatSenderAddress adds PizzaDelight display name to raw email addresses', () => {
  assert.equal(
    formatSenderAddress('orders@pizzadelight.com'),
    '"PizzaDelight" <orders@pizzadelight.com>'
  );
  assert.equal(
    formatSenderAddress('  verified-sender@domain.com  '),
    '"PizzaDelight" <verified-sender@domain.com>'
  );
});

test('formatSenderAddress preserves existing name or angle-bracketed formats', () => {
  assert.equal(
    formatSenderAddress('PizzaDelight <orders@pizzadelight.com>'),
    'PizzaDelight <orders@pizzadelight.com>'
  );
  assert.equal(
    formatSenderAddress('"Custom Brand" <support@pizzadelight.com>'),
    '"Custom Brand" <support@pizzadelight.com>'
  );
  assert.equal(
    formatSenderAddress('<orders@pizzadelight.com>'),
    '<orders@pizzadelight.com>'
  );
});

test('formatSenderAddress returns empty string for empty inputs', () => {
  assert.equal(formatSenderAddress(''), '');
  assert.equal(formatSenderAddress('   '), '');
  assert.equal(formatSenderAddress(null), '');
  assert.equal(formatSenderAddress(undefined), '');
});

test('env.emailFrom prioritizes process.env.EMAIL_FROM and NEVER uses SMTP_USER', () => {
  const originalEmailFrom = process.env.EMAIL_FROM;
  const originalSmtpFrom = process.env.SMTP_FROM;
  const originalSmtpUser = process.env.SMTP_USER;
  const originalEnvEmailFrom = env._emailFrom;

  try {
    env._emailFrom = undefined;

    // Case 1: EMAIL_FROM is configured, SMTP_USER is Brevo login
    process.env.EMAIL_FROM = 'verified-sender@pizzadelight.com';
    process.env.SMTP_USER = '7a8b9c@smtp-brevo.com';
    delete process.env.SMTP_FROM;

    assert.equal(env.emailFrom, '"PizzaDelight" <verified-sender@pizzadelight.com>');
    assert.notEqual(env.emailFrom, process.env.SMTP_USER);
    assert.ok(!env.emailFrom.includes('smtp-brevo.com'));

    // Case 2: EMAIL_FROM is empty, SMTP_FROM is set (legacy fallback)
    delete process.env.EMAIL_FROM;
    process.env.SMTP_FROM = 'legacy-sender@pizzadelight.com';
    assert.equal(env.emailFrom, '"PizzaDelight" <legacy-sender@pizzadelight.com>');

    // Case 3: Neither EMAIL_FROM nor SMTP_FROM is set - MUST NOT fall back to SMTP_USER
    delete process.env.EMAIL_FROM;
    delete process.env.SMTP_FROM;
    process.env.SMTP_USER = '7a8b9c@smtp-brevo.com';

    assert.equal(env.emailFrom, '', 'Must return empty string and not fall back to SMTP_USER');
    assert.notEqual(env.emailFrom, process.env.SMTP_USER);
  } finally {
    process.env.EMAIL_FROM = originalEmailFrom;
    process.env.SMTP_FROM = originalSmtpFrom;
    process.env.SMTP_USER = originalSmtpUser;
    env._emailFrom = originalEnvEmailFrom;
  }
});

test('env.smtpFrom aliases env.emailFrom for backwards compatibility', () => {
  const originalEmailFrom = env._emailFrom;
  try {
    env.emailFrom = '"PizzaDelight" <orders@pizzadelight.com>';
    assert.equal(env.smtpFrom, '"PizzaDelight" <orders@pizzadelight.com>');

    env.smtpFrom = '"PizzaDelight" <test@pizzadelight.com>';
    assert.equal(env.emailFrom, '"PizzaDelight" <test@pizzadelight.com>');
  } finally {
    env._emailFrom = originalEmailFrom;
  }
});

// =========================================================================
// Outgoing Message Verification: Proof that outgoing emails use EMAIL_FROM, not SMTP_USER
// =========================================================================

test('Outgoing registration OTP email uses EMAIL_FROM and not SMTP_USER', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalHost = env.smtpHost;
  const originalUser = env.smtpUser;
  const originalPass = env.smtpPass;
  const originalEmailFrom = env._emailFrom;

  const capturedMail = [];
  let capturedTransportConfig = null;

  try {
    env.smtpHost = 'smtp-relay.brevo.com';
    env.smtpPort = 587;
    env.smtpUser = '7654321@smtp-brevo.com'; // Brevo SMTP login
    env.smtpPass = 'secret_brevo_key';
    env.emailFrom = '"PizzaDelight" <noreply@pizzadelight.com>'; // Verified sender

    nodemailer.createTransport = (config) => {
      capturedTransportConfig = config;
      return {
        sendMail: async (mailOptions) => {
          capturedMail.push(mailOptions);
          return { messageId: '<test-otp-msg-123@pizzadelight.com>' };
        },
      };
    };

    await sendOtpEmail({
      email: 'customer@example.com',
      name: 'John Doe',
      otp: '123456',
    });

    assert.equal(capturedMail.length, 1);
    const sent = capturedMail[0];

    // Transporter auth MUST use SMTP_USER
    assert.ok(capturedTransportConfig);
    assert.equal(capturedTransportConfig.auth.user, '7654321@smtp-brevo.com');

    // Mail FROM MUST use EMAIL_FROM and NEVER SMTP_USER
    assert.equal(sent.from, '"PizzaDelight" <noreply@pizzadelight.com>');
    assert.notEqual(sent.from, env.smtpUser);
    assert.ok(!sent.from.includes('@smtp-brevo.com'));
    assert.equal(sent.to, 'customer@example.com');
    assert.equal(sent.subject, 'Your PizzaDelight Verification Code');
    assert.ok(sent.text.includes('123456'));
    assert.ok(sent.html.includes('123456'));
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    env.smtpHost = originalHost;
    env.smtpUser = originalUser;
    env.smtpPass = originalPass;
    env._emailFrom = originalEmailFrom;
  }
});

test('Outgoing link-based verification email uses EMAIL_FROM and not SMTP_USER', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalHost = env.smtpHost;
  const originalUser = env.smtpUser;
  const originalPass = env.smtpPass;
  const originalEmailFrom = env._emailFrom;

  const capturedMail = [];
  let capturedTransportConfig = null;

  try {
    env.smtpHost = 'smtp-relay.brevo.com';
    env.smtpPort = 587;
    env.smtpUser = 'login-id@smtp-brevo.com';
    env.smtpPass = 'secret_smtp_pass';
    env.emailFrom = '"PizzaDelight" <verify@pizzadelight.com>';

    nodemailer.createTransport = (config) => {
      capturedTransportConfig = config;
      return {
        sendMail: async (mailOptions) => {
          capturedMail.push(mailOptions);
          return { messageId: '<test-verify-msg-456@pizzadelight.com>' };
        },
      };
    };

    await sendVerificationEmail({
      email: 'newuser@example.com',
      name: 'Jane Doe',
      token: 'mock-verification-token-32bytes',
    });

    assert.equal(capturedMail.length, 1);
    const sent = capturedMail[0];

    // SMTP Auth uses SMTP_USER
    assert.equal(capturedTransportConfig.auth.user, 'login-id@smtp-brevo.com');

    // Message From uses EMAIL_FROM, not SMTP_USER
    assert.equal(sent.from, '"PizzaDelight" <verify@pizzadelight.com>');
    assert.notEqual(sent.from, env.smtpUser);
    assert.ok(!sent.from.includes('@smtp-brevo.com'));
    assert.equal(sent.to, 'newuser@example.com');
    assert.equal(sent.subject, 'Verify your Pizza Delivery account');
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    env.smtpHost = originalHost;
    env.smtpUser = originalUser;
    env.smtpPass = originalPass;
    env._emailFrom = originalEmailFrom;
  }
});

test('Outgoing password reset email uses EMAIL_FROM and not SMTP_USER', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalHost = env.smtpHost;
  const originalUser = env.smtpUser;
  const originalPass = env.smtpPass;
  const originalEmailFrom = env._emailFrom;

  const capturedMail = [];
  let capturedTransportConfig = null;

  try {
    env.smtpHost = 'smtp-relay.brevo.com';
    env.smtpPort = 587;
    env.smtpUser = 'login-id@smtp-brevo.com';
    env.smtpPass = 'secret_smtp_pass';
    env.emailFrom = '"PizzaDelight" <security@pizzadelight.com>';

    nodemailer.createTransport = (config) => {
      capturedTransportConfig = config;
      return {
        sendMail: async (mailOptions) => {
          capturedMail.push(mailOptions);
          return { messageId: '<test-reset-msg-789@pizzadelight.com>' };
        },
      };
    };

    await sendPasswordResetEmail({
      email: 'user-reset@example.com',
      name: 'Alice',
      token: 'mock-reset-token-32bytes',
    });

    assert.equal(capturedMail.length, 1);
    const sent = capturedMail[0];

    // SMTP Auth uses SMTP_USER
    assert.equal(capturedTransportConfig.auth.user, 'login-id@smtp-brevo.com');

    // Message From uses EMAIL_FROM, not SMTP_USER
    assert.equal(sent.from, '"PizzaDelight" <security@pizzadelight.com>');
    assert.notEqual(sent.from, env.smtpUser);
    assert.ok(!sent.from.includes('@smtp-brevo.com'));
    assert.equal(sent.to, 'user-reset@example.com');
    assert.equal(sent.subject, 'Reset your Pizza Delivery password');
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    env.smtpHost = originalHost;
    env.smtpUser = originalUser;
    env.smtpPass = originalPass;
    env._emailFrom = originalEmailFrom;
  }
});

test('Outgoing low-stock email uses EMAIL_FROM as sender and ADMIN_EMAIL as recipient', async () => {
  const originalCreateTransport = nodemailer.createTransport;
  const originalHost = env.smtpHost;
  const originalUser = env.smtpUser;
  const originalPass = env.smtpPass;
  const originalEmailFrom = env._emailFrom;

  const capturedMail = [];
  let capturedTransportConfig = null;

  try {
    env.smtpHost = 'smtp-relay.brevo.com';
    env.smtpPort = 587;
    env.smtpUser = 'login-id@smtp-brevo.com';
    env.smtpPass = 'secret_smtp_pass';
    env.emailFrom = '"PizzaDelight" <notifications@pizzadelight.com>';

    nodemailer.createTransport = (config) => {
      capturedTransportConfig = config;
      return {
        sendMail: async (mailOptions) => {
          capturedMail.push(mailOptions);
          return { messageId: '<test-alert-msg-999@pizzadelight.com>' };
        },
      };
    };

    await sendLowStockEmail({
      adminEmail: 'admin-recipient@pizzadelight.com',
      item: {
        name: 'Mozzarella',
        category: 'Cheese',
        quantity: 2,
        threshold: 5,
        unit: 'kg',
      },
    });

    assert.equal(capturedMail.length, 1);
    const sent = capturedMail[0];

    // SMTP Auth uses SMTP_USER
    assert.equal(capturedTransportConfig.auth.user, 'login-id@smtp-brevo.com');

    // Message FROM uses EMAIL_FROM, not SMTP_USER
    assert.equal(sent.from, '"PizzaDelight" <notifications@pizzadelight.com>');
    assert.notEqual(sent.from, env.smtpUser);
    assert.ok(!sent.from.includes('@smtp-brevo.com'));

    // Recipient is ADMIN_EMAIL
    assert.equal(sent.to, 'admin-recipient@pizzadelight.com');
  } finally {
    nodemailer.createTransport = originalCreateTransport;
    env.smtpHost = originalHost;
    env.smtpUser = originalUser;
    env.smtpPass = originalPass;
    env._emailFrom = originalEmailFrom;
  }
});

// =========================================================================
// Security / Non-Disclosure Logging Tests (Requirement 5)
// =========================================================================

test('Sensitive tokens, complete verification URLs, and OTPs are not logged to console', async () => {
  const originalLog = console.log;
  const logs = [];
  console.log = (...args) => {
    logs.push(args.join(' '));
  };

  const sensitiveToken = 'super-secret-token-abcdef1234567890';
  const rawOtp = '987654';

  try {
    // 1. sendOtpEmail dev fallback
    await sendOtpEmail({
      email: 'test@example.com',
      name: 'Test User',
      otp: rawOtp,
    });

    // 2. sendVerificationEmail
    await sendVerificationEmail({
      email: 'test@example.com',
      name: 'Test User',
      token: sensitiveToken,
    });

    // 3. sendPasswordResetEmail
    await sendPasswordResetEmail({
      email: 'test@example.com',
      name: 'Test User',
      token: sensitiveToken,
    });

    const combinedLogs = logs.join('\n');

    // MUST NOT log the raw OTP
    assert.ok(!combinedLogs.includes(rawOtp), 'Must not log raw OTP to console');

    // MUST NOT log raw sensitive tokens
    assert.ok(!combinedLogs.includes(sensitiveToken), 'Must not log sensitive tokens to console');

    // MUST NOT log complete verification URL with token
    assert.ok(
      !combinedLogs.includes(`/verify-email?token=${sensitiveToken}`),
      'Must not log complete verification URL with token'
    );
    assert.ok(
      !combinedLogs.includes(`/reset-password?token=${sensitiveToken}`),
      'Must not log complete password reset URL with token'
    );
  } finally {
    console.log = originalLog;
  }
});
