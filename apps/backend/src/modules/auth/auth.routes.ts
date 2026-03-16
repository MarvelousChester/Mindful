/**
 * @filename auth.routes.ts
 * @date 2026-03-15
 * @author Salman Nouman Abulqasim
 * @fileoverview Authentication routes for handling user registration and login
 * @version 1.0.0
 */

import { Router, type Router as ExpressRouter } from 'express';
import { loginUser, registerUser } from './auth.controller.js';

const authRouter: ExpressRouter = Router();

authRouter.post('/register', registerUser);
authRouter.post('/login', loginUser);

export default authRouter;
