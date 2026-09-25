import mongoose from 'mongoose';

export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: 'API is running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
}
