import { Router } from 'express';
import {
  AuthController,
  registerSchema,
  loginSchema,
  heartbeatSchema,
  redeemSchema,
} from '../controllers/authController';
import { validateBody } from '../middlewares/validation';
import { requireAuth } from '../middlewares/authGuard';
import { authRateLimiter } from '../middlewares/rateLimiter';

const router = Router();
const controller = new AuthController();

// Public authentication routes
router.post('/register', authRateLimiter, validateBody(registerSchema), controller.register);
router.post('/login', authRateLimiter, validateBody(loginSchema), controller.login);

// Protected routes (require RS256 token)
router.get('/me', requireAuth, controller.getProfile);
router.post('/heartbeat', requireAuth, validateBody(heartbeatSchema), controller.heartbeat);
router.post('/redeem', requireAuth, validateBody(redeemSchema), controller.redeem);
router.post('/logout', requireAuth, controller.logout);

export default router;