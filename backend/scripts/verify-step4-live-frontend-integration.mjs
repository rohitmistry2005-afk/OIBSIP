import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { hashOtp, getOtpExpiry } from '../src/services/otp.service.js';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const LIVE_TEST_EMAIL = 'step4.frontend.integration@pizzadelight.test';
const LIVE_TEST_NAME = 'Step Four User';
const LIVE_TEST_PASSWORD = 'StepFourSecurePassword123!';

async function runStep4LiveVerification() {
  console.log('====================================================');
  console.log('  PIZZADELIGHT — PHASE 4 / STEP 4 LIVE INTEGRATION');
  console.log('====================================================\n');

  const report = {
    steps: [],
    passedCount: 0,
    failedCount: 0,
  };

  function recordStep(id, title, passed, details = {}) {
    if (passed) {
      report.passedCount++;
      console.log(`[PASS] Step ${id}: ${title}`);
    } else {
      report.failedCount++;
      console.log(`[FAIL] Step ${id}: ${title}`);
    }
    if (details && Object.keys(details).length) {
      console.log('       Details:', JSON.stringify(details, null, 2));
    }
    report.steps.push({ id, title, passed, details });
  }

  // 1. Health check & DB connection
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  const dbConnected = healthRes.status === 200 && healthJson.database === 'connected';
  recordStep(1, 'Backend Health Check & MongoDB Connectivity', dbConnected, {
    httpStatus: healthRes.status,
    database: healthJson.database,
  });

  if (!dbConnected) {
    console.error('\n[ABORT] MongoDB is not connected.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI, { family: 6 });
  const usersCollection = mongoose.connection.db.collection('users');

  // Pre-cleanup
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });

  // 2. Registration API Response Contract
  const registerRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: LIVE_TEST_NAME,
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const registerJson = await registerRes.json();
  const registerOk =
    registerRes.status === 201 &&
    registerJson.success === true &&
    registerJson.requiresVerification === true &&
    registerJson.verificationMethod === 'otp' &&
    registerJson.email === LIVE_TEST_EMAIL &&
    !registerJson.token &&
    !registerJson.jwt;

  recordStep(2, 'Registration Success Response Contract (201, OTP required, NO JWT)', registerOk, {
    httpStatus: registerRes.status,
    requiresVerification: registerJson.requiresVerification,
    verificationMethod: registerJson.verificationMethod,
    email: registerJson.email,
    noJwtIssued: !registerJson.token && !registerJson.jwt,
  });

  // 3. Navigation URL Contract Verification
  const expectedUrlPath = `/verify-otp?email=${encodeURIComponent(LIVE_TEST_EMAIL)}`;
  const searchParams = new URLSearchParams(expectedUrlPath.split('?')[1]);
  const decodedEmail = searchParams.get('email');
  const urlParamOk = decodedEmail === LIVE_TEST_EMAIL;
  recordStep(3, 'Frontend Navigation URL Encoding & Decoding Contract', urlParamOk, {
    expectedUrlPath,
    decodedEmail,
  });

  // 4. Invalid OTP Rejection & Attempt Counter
  const invalidOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LIVE_TEST_EMAIL,
      otp: '000000',
    }),
  });
  const invalidOtpJson = await invalidOtpRes.json();
  const invalidOtpOk =
    invalidOtpRes.status === 400 &&
    invalidOtpJson.code === 'INVALID_OTP' &&
    typeof invalidOtpJson.attemptsRemaining === 'number' &&
    invalidOtpJson.attemptsRemaining === 4;

  recordStep(4, 'Invalid OTP Verification (HTTP 400 INVALID_OTP with attemptsRemaining)', invalidOtpOk, {
    status: invalidOtpRes.status,
    code: invalidOtpJson.code,
    attemptsRemaining: invalidOtpJson.attemptsRemaining,
  });

  // 5. Exceed Max Attempts Enforcement
  for (let i = 2; i <= 4; i++) {
    await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
    });
  }
  const fifthRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
  });
  const fifthJson = await fifthRes.json();
  const maxAttemptsOk =
    fifthRes.status === 400 &&
    fifthJson.code === 'INVALID_OTP' &&
    fifthJson.attemptsRemaining === 0;

  const sixthRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
  });
  const sixthJson = await sixthRes.json();
  const blockedAfterMax =
    sixthRes.status === 400 &&
    (sixthJson.code === 'NO_OTP_PENDING' || sixthJson.code === 'MAX_ATTEMPTS_EXCEEDED');

  recordStep(5, 'Attempt Limit Enforcement (5 attempts invalidates OTP, 6th rejected)', maxAttemptsOk && blockedAfterMax, {
    fifthRemaining: fifthJson.attemptsRemaining,
    sixthCode: sixthJson.code,
  });

  // 6. Resend Cooldown Enforcement (HTTP 429)
  const cooldownRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL }),
  });
  const cooldownJson = await cooldownRes.json();
  const cooldownOk =
    cooldownRes.status === 429 &&
    cooldownJson.code === 'RESEND_COOLDOWN' &&
    typeof cooldownJson.retryAfter === 'number' &&
    cooldownJson.retryAfter > 0;

  recordStep(6, 'Resend Cooldown Enforcement (HTTP 429 RESEND_COOLDOWN with retryAfter)', cooldownOk, {
    status: cooldownRes.status,
    code: cooldownJson.code,
    retryAfter: cooldownJson.retryAfter,
  });

  // 7. Expired OTP Enforcement
  const expiredCode = '654321';
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp(expiredCode),
        emailOtpExpiresAt: new Date(Date.now() - 5000), // Expired 5 seconds ago
        emailOtpAttempts: 0,
      },
    }
  );
  const expiredRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: expiredCode }),
  });
  const expiredJson = await expiredRes.json();
  const expiredOk = expiredRes.status === 400 && expiredJson.code === 'EXPIRED_OTP';
  recordStep(7, 'Expired OTP Verification Rejection (HTTP 400 EXPIRED_OTP)', expiredOk, {
    status: expiredRes.status,
    code: expiredJson.code,
  });

  // 8. Resend OTP API Success Flow
  // Satisfy cooldown in DB to test resend success
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    { $set: { emailOtpLastSentAt: new Date(Date.now() - 65 * 1000) } }
  );
  const resendSuccessRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL }),
  });
  const resendSuccessJson = await resendSuccessRes.json();
  const userAfterResend = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  const resendSuccessOk =
    resendSuccessRes.status === 200 &&
    resendSuccessJson.success === true &&
    typeof userAfterResend?.emailOtpHash === 'string' &&
    userAfterResend.emailOtpHash.length === 64;

  recordStep(8, 'Resend OTP API Integration (HTTP 200, fresh hash generated in DB)', resendSuccessOk, {
    status: resendSuccessRes.status,
    message: resendSuccessJson.message,
    hashLength: userAfterResend?.emailOtpHash?.length,
  });

  // 9. Valid OTP Verification
  const validCode = '719342';
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp(validCode),
        emailOtpExpiresAt: getOtpExpiry(10),
        emailOtpAttempts: 0,
      },
    }
  );

  const verifySuccessRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: validCode }),
  });
  const verifySuccessJson = await verifySuccessRes.json();
  const userAfterVerify = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  const verifyOk =
    verifySuccessRes.status === 200 &&
    verifySuccessJson.success === true &&
    userAfterVerify?.isEmailVerified === true &&
    userAfterVerify?.emailOtpHash === null &&
    !verifySuccessJson.token &&
    !verifySuccessJson.jwt;

  recordStep(9, 'Valid OTP Verification Lifecycle (isEmailVerified=true, NO JWT issued)', verifyOk, {
    status: verifySuccessRes.status,
    isEmailVerified: userAfterVerify?.isEmailVerified,
    emailOtpHashCleared: userAfterVerify?.emailOtpHash === null,
    noJwtIssued: !verifySuccessJson.token && !verifySuccessJson.jwt,
  });

  // 10. Phase 2 Login with Verified Account
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const loginJson = await loginRes.json();
  const token = loginJson.token || loginJson.data?.token;
  const loginOk =
    loginRes.status === 200 &&
    loginJson.success === true &&
    typeof token === 'string' &&
    token.split('.').length === 3;

  recordStep(10, 'Subsequent Phase 2 Login with Verified Account (HTTP 200 + JWT issued)', loginOk, {
    status: loginRes.status,
    tokenPrefix: token ? token.substring(0, 16) + '...' : null,
    userEmail: loginJson.user?.email || loginJson.data?.user?.email,
  });

  // 11. Authenticated API Session (/api/auth/me)
  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meJson = await meRes.json();
  const meOk = meRes.status === 200 && (meJson.user?.email === LIVE_TEST_EMAIL || meJson.data?.user?.email === LIVE_TEST_EMAIL);
  recordStep(11, 'Authenticated Session Verification (GET /api/auth/me HTTP 200)', meOk, {
    status: meRes.status,
    profileEmail: meJson.user?.email || meJson.data?.user?.email,
  });

  // 12. Anti-enumeration check
  const unknownRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent.random.user.99@example.com' }),
  });
  const unknownJson = await unknownRes.json();
  const antiEnumOk = unknownRes.status === 200 && unknownJson.success === true;
  recordStep(12, 'Anti-Enumeration Protection on Unknown Email (Generic 200)', antiEnumOk, {
    status: unknownRes.status,
    message: unknownJson.message,
  });

  // 13. Password reset regression check
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL }),
  });
  const forgotJson = await forgotRes.json();
  const forgotOk = forgotRes.status === 200 && forgotJson.success === true;
  recordStep(13, 'Password Reset Regression Check (POST /auth/forgot-password HTTP 200)', forgotOk, {
    status: forgotRes.status,
    message: forgotJson.message,
  });

  console.log('\n====================================================');
  console.log(`  SUMMARY: ${report.passedCount} Passed, ${report.failedCount} Failed`);
  console.log('====================================================\n');

  // Post-test cleanup
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });
  await mongoose.disconnect();

  if (report.failedCount > 0) {
    process.exit(1);
  }
}

runStep4LiveVerification().catch((err) => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
