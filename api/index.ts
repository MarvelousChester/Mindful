/**
 * @filename index.ts
 * @fileoverview Vercel serverless function entry point for the backend API
 * This file imports and exports the Express app to work with Vercel's serverless functions
 */

import app from '../apps/backend/dist/index.js';

export default app;
