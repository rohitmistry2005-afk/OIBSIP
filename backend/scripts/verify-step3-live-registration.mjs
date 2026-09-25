import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000/api';
const LIVE_TEST_EMAIL = 'new.user.registration.live@pizzadelight.test';
const LIVE_TEST_NAME = 'Live Test Registrant';
const LIVE_TEST_PASSWORD = 'LiveSecretPassword123!';

async function runStep3LiveVerification() {
  console.log('====================================================');
  console.log('  PIZZADELIGHT — PHASE 4 / STEP 3 REGISTRATION TEST');
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

  // Connect direct mongoose connection for test assertion & inspection
  await mongoose.connect(process.env.MONGO_URI, { family: 6 });
  const usersCollection = mongoose.connection.db.collection('users');

  // Pre-cleanup
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });

  // 2. Pre-flight Validation: Missing name
  const val1Res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: '', email: LIVE_TEST_EMAIL, password: LIVE_TEST_PASSWORD }),
  });
  const val1Json = await val1Res.json();
  recordStep(2, 'Pre-flight Validation: Missing Name (HTTP 400)', val1Res.status === 400 && val1Json.success === false, {
    status: val1Res.status,
    message: val1Json.message,
  });

  // 3. Pre-flight Validation: Malformed email
  const val2Res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: LIVE_TEST_NAME, email: 'not-an-email', password: LIVE_TEST_PASSWORD }),
  });
  const val2Json = await val2Res.json();
  recordStep(3, 'Pre-flight Validation: Malformed Email (HTTP 400)', val2Res.status === 400 && val2Json.success === false, {
    status: val2Res.status,
    message: val2Json.message,
  });

  // 4. Pre-flight Validation: Short password
  const val3Res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: LIVE_TEST_NAME, email: LIVE_TEST_EMAIL, password: 'short' }),
  });
  const val3Json = await val3Res.json();
  recordStep(4, 'Pre-flight Validation: Short Password < 8 Chars (HTTP 400)', val3Res.status === 400 && val3Json.success === false, {
    status: val3Res.status,
    message: val3Json.message,
  });

  // 5. Live Registration of New User
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `  ${LIVE_TEST_NAME}  `,
      email: `  ${LIVE_TEST_EMAIL.toUpperCase()}  `,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const regJson = await regRes.json();
  const noJwtIssued = regJson.token === undefined && regJson.jwt === undefined;
  const regContractOk =
    regRes.status === 201 &&
    regJson.success === true &&
    regJson.requiresVerification === true &&
    regJson.verificationMethod === 'otp' &&
    regJson.email === LIVE_TEST_EMAIL &&
    noJwtIssued;

  recordStep(5, 'Live Registration of New User (HTTP 201, OTP required, NO JWT)', regContractOk, {
    httpStatus: regRes.status,
    requiresVerification: regJson.requiresVerification,
    verificationMethod: regJson.verificationMethod,
    email: regJson.email,
    noJwtIssued,
  });

  // 6. Direct MongoDB Atlas Document Verification
  const userInDb = await usersCollection.findOne({ email: LIVE_TEST_EMAIL });
  const hashValid = typeof userInDb?.emailOtpHash === 'string' && userInDb.emailOtpHash.length === 64;
  const expiryValid = userInDb?.emailOtpExpiresAt && new Date(userInDb.emailOtpExpiresAt) > new Date();
  const attemptsValid = userInDb?.emailOtpAttempts === 0;
  const methodValid = userInDb?.emailVerificationMethod === 'otp';
  const unverified = userInDb?.isEmailVerified === false;
  const legacyNull = userInDb?.verificationToken === null;
  const passwordHashed = await bcrypt.compare(LIVE_TEST_PASSWORD, userInDb?.passwordHash || '');

  const dbStateOk =
    Boolean(userInDb) &&
    hashValid &&
    expiryValid &&
    attemptsValid &&
    methodValid &&
    unverified &&
    legacyNull &&
    passwordHashed;

  recordStep(6, 'MongoDB Document Inspection: OTP Hash, Expiry, Unverified State, Bcrypt Password', dbStateOk, {
    userFound: Boolean(userInDb),
    isEmailVerified: userInDb?.isEmailVerified,
    emailVerificationMethod: userInDb?.emailVerificationMethod,
    hashLength: userInDb?.emailOtpHash?.length,
    hashPrefix: userInDb?.emailOtpHash?.substring(0, 8) + '...',
    expiresAt: userInDb?.emailOtpExpiresAt,
    attempts: userInDb?.emailOtpAttempts,
    legacyTokenNull: userInDb?.verificationToken === null,
    passwordMatch: passwordHashed,
  });

  // 7. Duplicate Email Protection on Live Database
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Another User',
      email: LIVE_TEST_EMAIL,
      password: 'AnotherPassword123!',
    }),
  });
  const dupJson = await dupRes.json();
  recordStep(7, 'Duplicate Email Conflict Protection (HTTP 409)', dupRes.status === 409 && dupJson.success === false, {
    status: dupRes.status,
    message: dupJson.message,
  });

  // 8. Unverified Login Block
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: LIVE_TEST_EMAIL,
      password: LIVE_TEST_PASSWORD,
    }),
  });
  const loginJson = await loginRes.json();
  const loginBlocked = loginRes.status === 403 && loginJson.requiresVerification === true;
  recordStep(8, 'Unverified Account Login Enforcement (HTTP 403, requiresVerification=true)', loginBlocked, {
    status: loginRes.status,
    requiresVerification: loginJson.requiresVerification,
    message: loginJson.message,
  });

  // Cleanup test user
  await usersCollection.deleteOne({ email: LIVE_TEST_EMAIL });
  await mongoose.disconnect();

  console.log('\n====================================================');
  console.log(`  SUMMARY: ${report.passedCount} Passed, ${report.failedCount} Failed`);
  console.log('====================================================\n');

  return report;
}

runStep3LiveVerification().catch(err => {
  console.error('[FATAL ERROR]:', err);
  process.exit(1);
});
