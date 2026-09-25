import 'dotenv/config';

const required = ['MONGO_URI', 'JWT_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`[env] ${key} is not set. It is required when the corresponding feature is used.`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'development-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  smtpHost: process.env.SMTP_HOST || '',
  smtpPort: Number(process.env.SMTP_PORT || 587),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || process.env.SMTP_USER || '',
  adminEmail: process.env.ADMIN_EMAIL || '',
  get razorpayKeyId() {
    return (process.env.RAZORPAY_KEY_ID || '').trim();
  },
  get razorpayKeySecret() {
    return (process.env.RAZORPAY_KEY_SECRET || '').trim();
  },
  get razorpayCurrency() {
    return (process.env.RAZORPAY_CURRENCY || 'INR').trim();
  },
};
