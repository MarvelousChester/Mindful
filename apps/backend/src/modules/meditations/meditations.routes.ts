/**
 * @filename meditations.routes.ts
 * @date 2026-04-15
 * @author Jasmine Kaur
 * @fileoverview Express routes for the meditation discovery endpoints
 * @version 1.0.0
 */

import { Router, type Router as ExpressRouter } from 'express';
import { getMeditationById, getMeditationFilters, getMeditations } from './meditations.controller.js';

const meditationsRouter: ExpressRouter = Router();

// GET /api/meditations          → list all (with optional ?search= ?category= ?page= ?limit=)
meditationsRouter.get('/', getMeditations);

// GET /api/meditations/filters  → list available categories/languages with counts
meditationsRouter.get('/filters', getMeditationFilters);

// GET /api/meditations/:id      → single meditation by UUID
meditationsRouter.get('/:id', getMeditationById);

export default meditationsRouter;
