import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Admin } from '../src/models/admin.model.js';

const rawArgs = process.argv.slice(2);
let name, email, password;

if (rawArgs.length === 3) {
  [name, email, password] = rawArgs;
} else if (rawArgs.length > 3) {
  const emailIdx = rawArgs.findIndex((arg) => arg.includes('@'));
  if (emailIdx > 0 && emailIdx < rawArgs.length - 1) {
    name = rawArgs.slice(0, emailIdx).join(' ');
    email = rawArgs[emailIdx];
    password = rawArgs.slice(emailIdx + 1).join(' ');
  } else {
    [name, email, password] = rawArgs;
  }
}

if (!name || !email || !password) {
  console.error('Usage: npm run create-admin -- "Admin Name" admin@example.com StrongPassword');
  process.exit(1);
}

if (!env.mongoUri) {
  console.error('Error: MONGO_URI is not set. Please set MONGO_URI in backend/.env');
  process.exit(1);
}

try {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
} catch (err) {
  console.error(`Database connection failed: ${err.message}`);
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 12);
const normalizedEmail = email.toLowerCase().trim();
const existing = await Admin.findOne({ email: normalizedEmail });

if (existing) {
  existing.name = name;
  existing.passwordHash = passwordHash;
  existing.role = 'admin';
  await existing.save();
  console.log(`Admin updated: ${normalizedEmail}`);
} else {
  await Admin.create({ name, email: normalizedEmail, passwordHash, role: 'admin' });
  console.log(`Admin created: ${normalizedEmail}`);
}

await mongoose.disconnect();
