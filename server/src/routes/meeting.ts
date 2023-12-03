import { Router } from 'express';
import { accessMeeting, getMeeting } from '../controllers/meeting';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, accessMeeting);
router.route('/meeting').get(verifyJWT, getMeeting);

export default router;
