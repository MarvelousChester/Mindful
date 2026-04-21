/**
 * @filename history.routes.ts
 * @date 2026-04-16
 * @author Jasmine Kaur
 * @fileoverview routes for the listening history endpoints
 * @version 1.0.0
 */

import { Router, type Router as ExpressRouter } from 'express';
import { getHistory, getHistoryFilters, recordHistory } from './history.controller.js';

const historyRouter: ExpressRouter = Router();

// GET  /api/history  - authenticated user's listening history (newest first)
historyRouter.get('/', getHistory);

// GET /api/history/filters - authenticated user's category/language options with counts
historyRouter.get('/filters', getHistoryFilters);

// POST /api/history  - record a new listening session entry
historyRouter.post('/', recordHistory);

export default historyRouter;
