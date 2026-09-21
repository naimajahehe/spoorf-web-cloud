import { Router } from 'express';
import sessionController from '../controllers/sessionController';
import { requireAuth } from '../middlewares/authGuard';

const router = Router();

// All session management routes require authenticated RS256 Bearer token
router.get('/', requireAuth, sessionController.getSessions);
router.post('/revoke-all', requireAuth, sessionController.revokeAllSessions);
router.post('/:id/revoke', requireAuth, sessionController.revokeSession);

export default router;
