import { Admin } from '../models/admin.model.js';
import { User } from '../models/user.model.js';
import { verifyAuthToken } from '../utils/jwt.js';

function getBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  return header.slice(7);
}

export async function authenticateUser(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const payload = verifyAuthToken(token);
    if (payload.type !== 'user') return res.status(403).json({ success: false, message: 'User authentication required' });

    const user = await User.findById(payload.sub).select('-passwordHash');
    if (!user) return res.status(401).json({ success: false, message: 'User no longer exists' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired authentication token' });
  }
}

export async function authenticateAdmin(req, res, next) {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'Authentication required' });

    const payload = verifyAuthToken(token);
    if (payload.type !== 'admin' || payload.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin authentication required' });
    }

    const admin = await Admin.findById(payload.sub).select('-passwordHash');
    if (!admin) return res.status(401).json({ success: false, message: 'Admin no longer exists' });

    req.admin = admin;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired admin token' });
  }
}
