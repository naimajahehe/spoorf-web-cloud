import { Router } from 'express';
import downloadController from '../controllers/downloadController';

const router = Router();

router.get('/latest', downloadController.getLatestRelease);

export default router;
