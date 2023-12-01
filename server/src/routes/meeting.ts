import { Router } from 'express';
import { createMeeting } from '../controllers/meeting';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, createMeeting);

export default router;
