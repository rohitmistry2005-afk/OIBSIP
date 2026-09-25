import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../src/config/env.js';
import { Admin } from '../src/models/admin.model.js';

const [,, name, email, password] = process.argv;

if (!name || !email || !password) {
  console.error('Usage: npm run create-admin -- "Admin Name" admin@example.com StrongPassword');
  process.exit(1);
}

await mongoose.connect(env.mongoUri);
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
