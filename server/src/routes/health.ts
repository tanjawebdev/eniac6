// ============================================
// Health Check Route
// GET /health — returns server status, mode, and uptime.
// ============================================

import { Router } from 'express';
import { config } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    mock: config.mockMode,
    uptime: process.uptime(),
  });
});
