import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDatabase() {
  if (!env.mongoUri) {
    console.warn('[db] MONGO_URI is not set. Database operations will be unavailable.');
    return;
  }
  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      family: 6,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    try {
      await mongoose.connect(env.mongoUri, {
        serverSelectionTimeoutMS: 15000,
      });
      console.log('MongoDB connected successfully');
    } catch (fallbackError) {
      console.error('MongoDB connection warning:', fallbackError.message);
      console.warn('[db] Server started with database disconnected. Endpoints requiring database will return 500/error until MongoDB is available.');
    }
  }
}
