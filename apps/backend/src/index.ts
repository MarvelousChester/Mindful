/**
 * @filename index.ts
 * @date 2026-03-10
 * @author Salman Nouman Abulqasim
 * @fileoverview Express application entry point for the Mindful backend API
 * @version 1.0.0
 */

import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { env } from './config/env.js';
import authRouter from './routes/auth.js';

dotenv.config();

const app: express.Application = express();
const port = env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);

/**
 * Function: healthCheck
 * Description: Returns a simple status payload so the frontend or deployment platform can verify backend availability.
 * Params:
 * - req: The incoming Express request for the health endpoint.
 * - res: The Express response used to send the health status payload.
 * Returns:
 * - A JSON response with a single ok status value.
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

if (env.NODE_ENV !== 'production') {
  app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
  });
}

export default app;
