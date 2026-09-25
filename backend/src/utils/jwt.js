import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signAuthToken({ id, role, type }) {
  return jwt.sign({ sub: id, role, type }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function verifyAuthToken(token) {
  return jwt.verify(token, env.jwtSecret);
}
