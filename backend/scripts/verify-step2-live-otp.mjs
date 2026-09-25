import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { hashOtp, getOtpExpiry } from '../src/services/otp.service.js';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const TEST_EMAIL = 'otp.live.verification@pizzadelight.test';
const TEST_NAME = 'OTP Live Test User';

async function runLiveVerification() {
  console.log('====================================================');
  console.log('  PIZZADELIGHT — PHASE 4 / STEP 2 LIVE OTP TEST');
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

  // 1. Health check probe
  const healthRes = await fetch(`${BASE_URL}/health`);
  const healthJson = await healthRes.json();
  const dbConnected = healthRes.status === 200 && healthJson.database === 'connected';
  recordStep(1, 'Backend Health Check & Database Connection', dbConnected, {
    httpStatus: healthRes.status,
    database: healthJson.database,
  });

  if (!dbConnected) {
    console.error('\n[ABORT] MongoDB is not connected to the backend server.');
    console.error('Cannot run live database verification until MongoDB is connected.\n');
    return report;
  }

  // Connect direct mongoose connection for test assertion & inspection
  await mongoose.connect(process.env.MONGO_URI, { family: 6 });
  const usersCollection = mongoose.connection.db.collection('users');

  // Clean up any previous test user
  await usersCollection.deleteOne({ email: TEST_EMAIL });

  // 2. Anti-enumeration: resend-otp for unknown email
  const resendUnknownRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ghost.user.unknown@example.com' }),
  });
  const resendUnknownJson = await resendUnknownRes.json();
  recordStep(2, 'Anti-Enumeration on Unknown Email (resend-otp)', resendUnknownRes.status === 200 && resendUnknownJson.success === true, {
    status: resendUnknownRes.status,
    message: resendUnknownJson.message,
  });

  // Seed an unverified test user in MongoDB
  await usersCollection.insertOne({
    name: TEST_NAME,
    email: TEST_EMAIL,
    passwordHash: '$2a$12$e8wVf9H45oK9jZ6vE0d0E.uT5eE8E9E0E1E2E3E4E5E6E7E8E9E0E',
    isEmailVerified: false,
    emailOtpHash: null,
    emailOtpExpiresAt: null,
    emailOtpAttempts: 0,
    emailOtpLastSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Real OTP Generation & Storage via POST /resend-otp
  const resendTestRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
  const resendTestJson = await resendTestRes.json();

  const userAfterResend = await usersCollection.findOne({ email: TEST_EMAIL });
  const hashValid = typeof userAfterResend?.emailOtpHash === 'string' && userAfterResend.emailOtpHash.length === 64;
  const expiryValid = userAfterResend?.emailOtpExpiresAt && new Date(userAfterResend.emailOtpExpiresAt) > new Date();
  const lastSentValid = userAfterResend?.emailOtpLastSentAt && (Date.now() - new Date(userAfterResend.emailOtpLastSentAt).getTime() < 10000);

  recordStep(3, 'Real OTP Generation & Secure Hash Storage in MongoDB', resendTestRes.status === 200 && hashValid && expiryValid && lastSentValid, {
    httpStatus: resendTestRes.status,
    hashLength: userAfterResend?.emailOtpHash?.length,
    hashStartsWith: userAfterResend?.emailOtpHash?.substring(0, 8) + '...',
    expiresAt: userAfterResend?.emailOtpExpiresAt,
    attempts: userAfterResend?.emailOtpAttempts,
    method: userAfterResend?.emailVerificationMethod,
  });

  // 4. Anti-enumeration payload parity check
  const parityMatch = resendUnknownJson.message === resendTestJson.message;
  recordStep(4, 'Anti-Enumeration Response Parity (Existing vs Unknown)', parityMatch, {
    unknownMessage: resendUnknownJson.message,
    existingMessage: resendTestJson.message,
  });

  // 5. Resend Cooldown Enforcement (< 60 seconds)
  const immediateResendRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
  const immediateResendJson = await immediateResendRes.json();
  const cooldownEnforced = immediateResendRes.status === 429 && immediateResendJson.code === 'RESEND_COOLDOWN' && typeof immediateResendJson.retryAfter === 'number';
  recordStep(5, 'Server-Side 60s Resend Cooldown Enforcement (HTTP 429)', cooldownEnforced, {
    httpStatus: immediateResendRes.status,
    code: immediateResendJson.code,
    retryAfter: immediateResendJson.retryAfter,
  });

  // 6. Resend Replacement (Simulating cooldown elapse)
  const originalOtpHash = userAfterResend.emailOtpHash;
  await usersCollection.updateOne(
    { email: TEST_EMAIL },
    { $set: { emailOtpLastSentAt: new Date(Date.now() - 65 * 1000) } }
  );

  const secondResendRes = await fetch(`${BASE_URL}/auth/resend-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL }),
  });
  const userAfterSecondResend = await usersCollection.findOne({ email: TEST_EMAIL });
  const hashReplaced = userAfterSecondResend?.emailOtpHash && userAfterSecondResend.emailOtpHash !== originalOtpHash;

  recordStep(6, 'Resend Replacement (New OTP Invalidates Old OTP in MongoDB)', secondResendRes.status === 200 && hashReplaced, {
    httpStatus: secondResendRes.status,
    oldHashPrefix: originalOtpHash.substring(0, 8) + '...',
    newHashPrefix: userAfterSecondResend?.emailOtpHash?.substring(0, 8) + '...',
    attemptsReset: userAfterSecondResend?.emailOtpAttempts === 0,
  });

  // 7. OTP Attempt Counter & Limit (5 maximum attempts)
  let attemptsOk = true;
  for (let attempt = 1; attempt <= 4; attempt++) {
    const wrongRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, otp: `00000${attempt}` }),
    });
    const wrongJson = await wrongRes.json();
    const expectedRemaining = 5 - attempt;
    if (wrongRes.status !== 400 || wrongJson.code !== 'INVALID_OTP' || wrongJson.attemptsRemaining !== expectedRemaining) {
      attemptsOk = false;
    }
  }

  // 5th failed attempt -> returns 400 with attemptsRemaining: 0 and nullifies OTP in MongoDB
  const fifthRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: '000005' }),
  });
  const fifthJson = await fifthRes.json();
  const userAfterMaxAttempts = await usersCollection.findOne({ email: TEST_EMAIL });
  const invalidatedInDb = userAfterMaxAttempts?.emailOtpHash === null && userAfterMaxAttempts?.emailOtpExpiresAt === null;

  // 6th attempt -> immediately blocked because OTP is invalidated
  const sixthRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: '000006' }),
  });
  const sixthJson = await sixthRes.json();
  const subsequentBlocked = sixthRes.status === 400 && (sixthJson.code === 'NO_OTP_PENDING' || sixthJson.code === 'MAX_ATTEMPTS_EXCEEDED');

  recordStep(7, 'Attempt Limit (5 failed attempts invalidates OTP in MongoDB, blocks 6th)', attemptsOk && fifthRes.status === 400 && fifthJson.attemptsRemaining === 0 && invalidatedInDb && subsequentBlocked, {
    fifthStatus: fifthRes.status,
    fifthRemaining: fifthJson.attemptsRemaining,
    dbHashNullified: userAfterMaxAttempts?.emailOtpHash === null,
    dbExpiryNullified: userAfterMaxAttempts?.emailOtpExpiresAt === null,
    sixthBlocked: subsequentBlocked,
    sixthCode: sixthJson.code,
  });

  // 8. Expiration Enforcement
  const testValidOtp = '492816';
  await usersCollection.updateOne(
    { email: TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp(testValidOtp),
        emailOtpExpiresAt: new Date(Date.now() - 5000), // expired 5 seconds ago
        emailOtpAttempts: 0,
      },
    }
  );

  const expiredVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: testValidOtp }),
  });
  const expiredVerifyJson = await expiredVerifyRes.json();
  const userAfterExpired = await usersCollection.findOne({ email: TEST_EMAIL });
  const stillUnverified = userAfterExpired?.isEmailVerified === false;

  recordStep(8, 'OTP Expiration Enforcement (Expired OTP Rejected with HTTP 400)', expiredVerifyRes.status === 400 && expiredVerifyJson.code === 'EXPIRED_OTP' && stillUnverified, {
    status: expiredVerifyRes.status,
    code: expiredVerifyJson.code,
    isEmailVerified: userAfterExpired?.isEmailVerified,
  });

  // 9. Valid OTP Verification Lifecycle
  const workingOtp = '839201';
  await usersCollection.updateOne(
    { email: TEST_EMAIL },
    {
      $set: {
        emailOtpHash: hashOtp(workingOtp),
        emailOtpExpiresAt: getOtpExpiry(10),
        emailOtpAttempts: 0,
      },
    }
  );

  const validVerifyRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: workingOtp }),
  });
  const validVerifyJson = await validVerifyRes.json();
  const userAfterSuccess = await usersCollection.findOne({ email: TEST_EMAIL });
  const verifiedOk = userAfterSuccess?.isEmailVerified === true && userAfterSuccess?.emailOtpHash === null;
  const noJwtIssued = validVerifyJson.token === undefined && validVerifyJson.jwt === undefined;

  recordStep(9, 'Valid OTP Verification (isEmailVerified=true, fields cleared, NO JWT issued)', validVerifyRes.status === 200 && verifiedOk && noJwtIssued, {
    httpStatus: validVerifyRes.status,
    message: validVerifyJson.message,
    isEmailVerified: userAfterSuccess?.isEmailVerified,
    emailOtpHash: userAfterSuccess?.emailOtpHash,
    noJwtIssued,
  });

  // 10. Token Reuse Prevention
  const reuseRes = await fetch(`${BASE_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, otp: workingOtp }),
  });
  const reuseJson = await reuseRes.json();
  recordStep(10, 'Token Reuse Prevention (Consumed OTP cannot re-verify)', reuseRes.status === 200 && reuseJson.alreadyVerified === true, {
    status: reuseRes.status,
    code: reuseJson.code,
    alreadyVerified: reuseJson.alreadyVerified,
  });

  // Clean up test user
  await usersCollection.deleteOne({ email: TEST_EMAIL });
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`  SUMMARY: ${report.passedCount} Passed, ${report.failedCount} Failed`);
  console.log('====================================================\n');

  return report;
}

runLiveVerification().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
