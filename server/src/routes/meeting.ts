import { Router } from 'express';
import { accessMeeting } from '../controllers/meeting';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, accessMeeting);

export default router;
