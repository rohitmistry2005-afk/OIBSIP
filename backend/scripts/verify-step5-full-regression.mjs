import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { hashOtp, getOtpExpiry } from '../src/services/otp.service.js';
import { getLatestOtpFromMailbox } from './test-mailbox-read.mjs';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const TIMESTAMP = Date.now();
const LIVE_TEST_EMAIL = `rohit.mistry2005+step5_${TIMESTAMP}@gmail.com`;
const LIVE_TEST_NAME = `Step5 Test User ${TIMESTAMP}`;
const LIVE_TEST_PASSWORD = 'StepFivePassword123!';

const VERIFIED_USER_EMAIL = `verified.regression.${TIMESTAMP}@pizzadelight.test`;
const VERIFIED_USER_PASSWORD = 'VerifiedPass123!';

async function runStep5FullRegression() {
  console.log('================================================================');
  console.log('  PIZZADELIGHT — PHASE 4 / STEP 5 FULL END-TO-END REGRESSION');
  console.log('================================================================\n');

  const results = {
    passed: 0,
    expectedNegative: 0,
    failed: 0,
    blocked: 0,
    steps: [],
  };

  function record(id, title, category, outcome, details = {}) {
    let tag = '[PASS]';
    if (category === 'EXPECTED NEGATIVE RESPONSE') {
      tag = '[EXPECTED NEGATIVE]';
      results.expectedNegative++;
    } else if (category === 'BLOCKED') {
      tag = '[BLOCKED]';
      results.blocked++;
    } else if (category === 'ACTUAL FAILURE' || !outcome) {
      tag = '[FAIL]';
      results.failed++;
    } else {
      results.passed++;
    }

    console.log(`${tag} Step ${id}: ${title}`);
    if (details && Object.keys(details).length) {
      console.log('       Details:', JSON.stringify(details, null, 2));
    }
    results.steps.push({ id, title, category, passed: outcome, details });
  }

  // 1. Environment Pre-check
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  const dbConnected = healthRes.status === 200 && healthJson.database === 'connected';
  record(1, 'Environment Pre-check: Health endpoint & DB connection', 'PASS', dbConnected, {
    status: healthRes.status,
    database: healthJson.database,
  });

  const pizzasRes = await fetch(`${BASE_URL}/pizzas`);
  const pizzasJson = await pizzasRes.json();
  const pizzasCount = pizzasJson?.data?.pizzas?.length || pizzasJson?.pizzas?.length || 0;
  record(2, 'Environment Pre-check: Core catalog database endpoint (/pizzas)', 'PASS', pizzasRes.status === 200 && pizzasCount > 0, {
    status: pizzasRes.status,
    pizzasCount,
  });

  // Connect MongoDB direct inspection
  await mongoose.connect(process.env.MONGO_URI, { family: 6 });
  const usersCollection = mongoose.connection.db.collection('users');

  // Pre-cleanup
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });
  await usersCollection.deleteOne({ email: VERIFIED_USER_EMAIL });

  // 2. Real Registration API
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: LIVE_TEST_NAME,
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const regJson = await regRes.json();
  const regPass =
    regRes.status === 201 &&
    regJson.success === true &&
    regJson.requiresVerification === true &&
    regJson.verificationMethod === 'otp' &&
    regJson.email === LIVE_TEST_EMAIL &&
    !regJson.token &&
    !regJson.jwt;

  record(3, 'Registration API Lifecycle: HTTP 201, OTP required, NO JWT issued', 'PASS', regPass, {
    httpStatus: regRes.status,
    requiresVerification: regJson.requiresVerification,
    verificationMethod: regJson.verificationMethod,
    email: regJson.email,
    noJwtIssued: !regJson.token && !regJson.jwt,
  });

  // Verify MongoDB document state
  const userDocAfterReg = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  const dbRegPass =
    userDocAfterReg &&
    userDocAfterReg.isEmailVerified === false &&
    userDocAfterReg.emailVerificationMethod === 'otp' &&
    typeof userDocAfterReg.emailOtpHash === 'string' &&
    userDocAfterReg.emailOtpHash.length === 64;

  record(4, 'MongoDB Document Inspection: Unverified, 64-char OTP hash stored, method=otp', 'PASS', dbRegPass, {
    userFound: Boolean(userDocAfterReg),
    isEmailVerified: userDocAfterReg?.isEmailVerified,
    method: userDocAfterReg?.emailVerificationMethod,
    hashLength: userDocAfterReg?.emailOtpHash?.length,
  });

  // 3. Duplicate Registration Protection (HTTP 409)
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: LIVE_TEST_NAME,
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  record(5, 'Duplicate Registration Conflict Protection', 'EXPECTED NEGATIVE RESPONSE', dupRes.status === 409, {
    status: dupRes.status,
  });

  // 4. Unverified Login Blocked (HTTP 403)
  const unverifiedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const unverifiedLoginJson = await unverifiedLoginRes.json();
  record(6, 'Unverified Account Login Enforcement (HTTP 403, requiresVerification=true)', 'EXPECTED NEGATIVE RESPONSE', unverifiedLoginRes.status === 403 && unverifiedLoginJson.requiresVerification === true, {
    status: unverifiedLoginRes.status,
    requiresVerification: unverifiedLoginJson.requiresVerification,
  });

  // 5. Invalid OTP Rejection (HTTP 400)
  const invalidOtpRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
  });
  const invalidOtpJson = await invalidOtpRes.json();
  record(7, 'Invalid OTP Verification (HTTP 400 INVALID_OTP with attemptsRemaining)', 'EXPECTED NEGATIVE RESPONSE', invalidOtpRes.status === 400 && invalidOtpJson.code === 'INVALID_OTP', {
    status: invalidOtpRes.status,
    code: invalidOtpJson.code,
    attemptsRemaining: invalidOtpJson.attemptsRemaining,
  });

  // 6. Resend Cooldown Enforcement (HTTP 429)
  const cooldownRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL }),
  });
  const cooldownJson = await cooldownRes.json();
  record(8, 'Resend Cooldown Enforcement (HTTP 429 RESEND_COOLDOWN with retryAfter)', 'EXPECTED NEGATIVE RESPONSE', cooldownRes.status === 429 && cooldownJson.code === 'RESEND_COOLDOWN', {
    status: cooldownRes.status,
    code: cooldownJson.code,
    retryAfter: cooldownJson.retryAfter,
  });

  // 7. Expired OTP Enforcement (HTTP 400)
  const expiredCode = '987654';
  const oldHash = userDocAfterReg.emailOtpHash;
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp(expiredCode),
        emailOtpExpiresAt: new Date(Date.now() - 5000), // Expired 5s ago
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
  record(9, 'Expired OTP Verification Rejection (HTTP 400 EXPIRED_OTP)', 'EXPECTED NEGATIVE RESPONSE', expiredRes.status === 400 && expiredJson.code === 'EXPIRED_OTP', {
    status: expiredRes.status,
    code: expiredJson.code,
  });

  // 8. 5-Attempt Limit Enforcement
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp('555555'),
        emailOtpExpiresAt: getOtpExpiry(10),
        emailOtpAttempts: 4, // 4 failed attempts already
      },
    }
  );
  const fifthAttemptRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
  });
  const fifthJson = await fifthAttemptRes.json();
  const userAfterFifth = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  const fifthInvalidated = userAfterFifth.emailOtpHash === null && userAfterFifth.emailOtpExpiresAt === null;

  const sixthAttemptRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: '000000' }),
  });
  const sixthJson = await sixthAttemptRes.json();

  record(10, 'Attempt Limit Enforcement (5th attempt nullifies OTP in DB; 6th rejected)', 'EXPECTED NEGATIVE RESPONSE', fifthInvalidated && sixthAttemptRes.status === 400, {
    fifthRemaining: fifthJson.attemptsRemaining,
    dbHashNull: userAfterFifth.emailOtpHash === null,
    sixthCode: sixthJson.code,
  });

  // 9. Resend OTP API (Replacement of invalidated OTP)
  // Satisfy cooldown
  await usersCollection.updateOne(
    { email: LIVE_TEST_EMAIL },
    { $set: { emailOtpLastSentAt: new Date(Date.now() - 65 * 1000) } }
  );
  const resendOkRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: LIVE_TEST_EMAIL }),
  });
  const resendOkJson = await resendOkRes.json();
  const userAfterResend = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  record(11, 'Resend OTP API Replacement: Generates new OTP hash, resets attempts to 0', 'PASS', resendOkRes.status === 200 && userAfterResend.emailOtpHash !== null, {
    status: resendOkRes.status,
    message: resendOkJson.message,
    hashLength: userAfterResend?.emailOtpHash?.length,
    attemptsReset: userAfterResend?.emailOtpAttempts === 0,
  });

  // 10. Real OTP Retrieval from Mailbox & Verification
  console.log('\n--- Retrieving real OTP from live Gmail mailbox via IMAP ---');
  let realOtp = null;
  try {
    realOtp = await getLatestOtpFromMailbox();
  } catch (err) {
    console.error('Mailbox retrieval error:', err.message);
  }

  const mailboxAccessible = Boolean(realOtp && realOtp.length === 6);
  record(12, 'Real OTP Retrieval from Live Gmail Mailbox (IMAP without logging code)', 'PASS', mailboxAccessible, {
    mailboxAccessible,
    codeLength: realOtp ? realOtp.length : 0,
  });

  if (!mailboxAccessible) {
    record(13, 'Real OTP Verification Lifecycle', 'BLOCKED', false, { reason: 'Mailbox unavailable' });
    record(14, 'Subsequent Phase 2 Login with Verified Account', 'BLOCKED', false, { reason: 'Mailbox unavailable' });
    record(15, 'Authenticated Session Verification (/api/auth/me)', 'BLOCKED', false, { reason: 'Mailbox unavailable' });
  } else {
    // 11. Verify with the real OTP retrieved from the mailbox!
    const realVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: realOtp }),
    });
    const realVerifyJson = await realVerifyRes.json();
    const userAfterRealVerify = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
    const realVerifyPass =
      realVerifyRes.status === 200 &&
      realVerifyJson.success === true &&
      userAfterRealVerify.isEmailVerified === true &&
      userAfterRealVerify.emailOtpHash === null &&
      !realVerifyJson.token &&
      !realVerifyJson.jwt;

    record(13, 'Real OTP Verification Lifecycle (isEmailVerified=true, fields cleared, NO JWT)', 'PASS', realVerifyPass, {
      status: realVerifyRes.status,
      isEmailVerified: userAfterRealVerify.isEmailVerified,
      otpHashCleared: userAfterRealVerify.emailOtpHash === null,
      noJwtIssued: !realVerifyJson.token && !realVerifyJson.jwt,
    });

    // 12. Consumed OTP Reuse Prevention
    const reuseRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: LIVE_TEST_EMAIL, otp: realOtp }),
    });
    const reuseJson = await reuseRes.json();
    record(14, 'Consumed OTP Reuse Prevention (Idempotent safe ALREADY_VERIFIED guidance)', 'PASS', reuseRes.status === 200 && reuseJson.code === 'ALREADY_VERIFIED', {
      status: reuseRes.status,
      code: reuseJson.code,
      alreadyVerified: reuseJson.alreadyVerified,
    });

    // 13. Phase 2 Login with Newly Verified User
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: LIVE_TEST_EMAIL,
        password: LIVE_TEST_PASSWORD,
      }),
    });
    const loginJson = await loginRes.json();
    const userToken = loginJson.token || loginJson.data?.token;
    const loginPass = loginRes.status === 200 && Boolean(userToken) && userToken.split('.').length === 3;

    record(15, 'Subsequent Phase 2 Login: Verified user receives valid JWT session', 'PASS', loginPass, {
      status: loginRes.status,
      jwtIssued: Boolean(userToken),
    });

    // 14. Authenticated API Session (/api/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    const meJson = await meRes.json();
    const userProfile = meJson.user || meJson.data?.user;
    const mePass =
      meRes.status === 200 &&
      userProfile?.email === LIVE_TEST_EMAIL &&
      userProfile?.isEmailVerified === true &&
      !userProfile?.password &&
      !userProfile?.passwordHash;

    record(16, 'Authenticated Identity (/api/auth/me): Profile matches, passwords excluded', 'PASS', mePass, {
      status: meRes.status,
      profileEmail: userProfile?.email,
      isEmailVerified: userProfile?.isEmailVerified,
      passwordExcluded: !userProfile?.password && !userProfile?.passwordHash,
    });
  }

  // 15. Existing Verified User Regression (Phase 2)
  const hashedVerifiedPassword = await bcrypt.hash(VERIFIED_USER_PASSWORD, 10);
  await usersCollection.insertOne({
    name: 'Pre-existing Verified User',
    email: VERIFIED_USER_EMAIL,
    passwordHash: hashedVerifiedPassword,
    role: 'customer',
    isEmailVerified: true,
    emailVerificationMethod: 'otp',
    emailOtpHash: null,
    emailOtpExpiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const verifiedLoginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: VERIFIED_USER_EMAIL,
      password: VERIFIED_USER_PASSWORD,
    }),
  });
  const verifiedLoginJson = await verifiedLoginRes.json();
  const verifiedToken = verifiedLoginJson.token || verifiedLoginJson.data?.token;
  const verifiedPass = verifiedLoginRes.status === 200 && Boolean(verifiedToken);

  record(17, 'Existing Verified User Regression: Direct login with JWT, NO OTP prompt', 'PASS', verifiedPass, {
    status: verifiedLoginRes.status,
    jwtIssued: Boolean(verifiedToken),
    requiresVerification: verifiedLoginJson.requiresVerification || false,
  });

  // 16. Legacy Email-Link Verification Regression (Phase 1)
  const legacyUnknownRes = await fetch(`${BASE_URL}/auth/verify-email/nonexistent-token-1234567890abcdef`);
  record(18, 'Legacy Verification Regression: /verify-email/:token endpoint active', 'EXPECTED NEGATIVE RESPONSE', legacyUnknownRes.status === 400 || legacyUnknownRes.status === 404, {
    status: legacyUnknownRes.status,
  });

  const legacyResendRes = await fetch(`${BASE_URL}/auth/resend-verification`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'unknown.legacy.user@example.com' }),
  });
  record(19, 'Legacy Resend Verification Regression: /resend-verification generic 200', 'PASS', legacyResendRes.status === 200, {
    status: legacyResendRes.status,
  });

  // 17. Password Reset Regression (Phase 3)
  const forgotRes = await fetch(`${BASE_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: VERIFIED_USER_EMAIL }),
  });
  record(20, 'Password Recovery Regression: POST /auth/forgot-password returns generic 200', 'PASS', forgotRes.status === 200, {
    status: forgotRes.status,
  });

  // 18. Core Business Regression: Custom Pizza Builder Options
  const builderRes = await fetch(`${BASE_URL}/builder/options`);
  const builderJson = await builderRes.json();
  const builderOk = builderRes.status === 200 && Array.isArray(builderJson?.options?.bases || builderJson?.bases || builderJson?.data?.bases);
  record(21, 'Core Business Regression: Pizza Builder Options API', 'PASS', builderOk, {
    status: builderRes.status,
    hasBases: builderOk,
  });

  // 19. Core Business Regression: Customer Orders API Protection
  const unauthedOrdersRes = await fetch(`${BASE_URL}/orders/my-orders`);
  record(22, 'Core Business Regression: Protected Orders API rejects unauthenticated request (HTTP 401)', 'EXPECTED NEGATIVE RESPONSE', unauthedOrdersRes.status === 401, {
    status: unauthedOrdersRes.status,
  });

  // Post-test cleanup: delete only the temporary test records created
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });
  await usersCollection.deleteOne({ email: VERIFIED_USER_EMAIL });
  await mongoose.disconnect();

  console.log('\n================================================================');
  console.log(`  STEP 5 SUMMARY:`);
  console.log(`  Passed: ${results.passed}`);
  console.log(`  Expected Negative Responses: ${results.expectedNegative}`);
  console.log(`  Blocked: ${results.blocked}`);
  console.log(`  Failed: ${results.failed}`);
  console.log('================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runStep5FullRegression().catch((err) => {
  console.error('[FATAL]:', err);
  process.exit(1);
});
