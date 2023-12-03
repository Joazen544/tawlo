import { Router } from 'express';
import {
  accessMeeting,
  getMeeting,
  replyMeeting,
} from '../controllers/meeting';
import { clickChatRoom } from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, accessMeeting);
router.route('/meeting').get(verifyJWT, getMeeting);
router
  .route('/meeting/:meetingId')
  .post(verifyJWT, replyMeeting, clickChatRoom);

export default router;
