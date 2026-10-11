import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function hasSmtpConfig() {
  return Boolean(env.smtpHost && env.smtpUser && env.smtpPass && env.emailFrom);
}

function getTransporter() {
  if (!hasSmtpConfig()) return null;
  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: { user: env.smtpUser, pass: env.smtpPass },
  });
}

function maskSensitiveContent(content) {
  if (!content) return '';
  return String(content)
    .replace(/https?:\/\/[^\s]+/gi, '[Link masked for security]')
    .replace(/\b\d{6}\b/g, '******');
}

async function sendMail({ from = env.emailFrom, to, subject, text, html, isOtp = false }) {
  const transporter = getTransporter();
  if (!transporter) {
    if (isOtp) {
      console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n[Verification Code dispatched: ****** (masked for security)]`);
    } else {
      const safeText = maskSensitiveContent(text);
      console.log(`[email:dev] To: ${to}\nSubject: ${subject}\n${safeText}`);
    }
    return { simulated: true };
  }
  const result = await transporter.sendMail({ from, to, subject, text, html });
  console.log(`[email:sent] To: ${to} Subject: "${subject}" MessageId: ${result.messageId}`);
  return result;
}

export async function sendOtpEmail({ email, name, otp }) {
  const recipientName = name ? name.trim() : 'there';
  const subject = 'Your PizzaDelight Verification Code';
  const text = [
    `Hi ${recipientName},`,
    '',
    `Your 6-digit email verification code is: ${otp}`,
    '',
    'This code will expire in 10 minutes.',
    'For security, never share this code with anyone.',
    '',
    'If you did not request this verification code, please ignore this email.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #261510; max-width: 600px; margin: 0 auto; padding: 24px; background: #fffdfa; border-radius: 12px; border: 1px solid #ebd9c8;">
      <h2 style="color: #b91c1c; margin-top: 0;">PizzaDelight Email Verification</h2>
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>Thank you for choosing PizzaDelight. Use the 6-digit verification code below to complete your email verification:</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #b91c1c; background: #fdf2e9; padding: 12px 24px; border-radius: 8px; border: 1px solid #f0d5be;">
          ${otp}
        </span>
      </div>
      <p style="font-size: 14px; color: #6d554a;">
        ⏱ <strong>This code will expire in 10 minutes.</strong><br/>
        🔒 If you did not request this verification code, you can safely ignore this email.
      </p>
    </div>
  `;

  return sendMail({
    to: email,
    subject,
    text,
    html,
    isOtp: true,
  });
}

export async function sendVerificationEmail({ email, name, token }) {
  const url = `${env.clientUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  console.log(`[email:dispatch] Verification email dispatched for ${email}`);
  return sendMail({
    to: email,
    subject: 'Verify your Pizza Delivery account',
    text: `Hi ${name}, verify your account using this link: ${url}`,
    html: `<p>Hi ${name},</p><p>Verify your Pizza Delivery account:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendPasswordResetEmail({ email, name, token }) {
  const url = `${env.clientUrl}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  return sendMail({
    to: email,
    subject: 'Reset your Pizza Delivery password',
    text: `Hi ${name}, reset your password using this link: ${url}`,
    html: `<p>Hi ${name},</p><p>Reset your password:</p><p><a href="${url}">${url}</a></p>`,
  });
}

export async function sendLowStockEmail({ adminEmail, item }) {
  const subject = `Low stock alert: ${item.name}`;
  const text = [
    'Pizza Delivery low-stock alert',
    '',
    `Item: ${item.name}`,
    `Category: ${item.category}`,
    `Current stock: ${item.quantity} ${item.unit}`,
    `Threshold: ${item.threshold} ${item.unit}`,
    '',
    'Please review and replenish this inventory item.',
  ].join('\n');

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5">
      <h2>Low stock alert</h2>
      <p><strong>${item.name}</strong> has fallen below its configured threshold.</p>
      <table cellpadding="6" cellspacing="0" border="1" style="border-collapse:collapse">
        <tr><td>Category</td><td>${item.category}</td></tr>
        <tr><td>Current stock</td><td>${item.quantity} ${item.unit}</td></tr>
        <tr><td>Threshold</td><td>${item.threshold} ${item.unit}</td></tr>
      </table>
    </div>`;

  return sendMail({ to: adminEmail, subject, text, html });
}
