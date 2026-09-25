import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpiresAt: { type: Date, default: null },
    resetToken: { type: String, default: null },
    resetTokenExpiresAt: { type: Date, default: null },
    emailOtpHash: { type: String, default: null },
    emailOtpExpiresAt: { type: Date, default: null },
    emailOtpAttempts: { type: Number, default: 0 },
    emailOtpLastSentAt: { type: Date, default: null },
    emailVerificationMethod: { type: String, enum: ['otp', 'legacy-link', null], default: null },
  },
  { timestamps: true }
);

export const User = mongoose.model('User', userSchema);
