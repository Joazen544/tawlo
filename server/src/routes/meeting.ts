import { Router } from 'express';
import {
  accessMeeting,
  getMeeting,
  replyMeeting,
  scoreMeeting,
  cancelMeeting,
} from '../controllers/meeting';
import { clickChatRoom } from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, accessMeeting);
router.route('/meeting').delete(verifyJWT, cancelMeeting);
router.route('/meeting').get(verifyJWT, getMeeting);
router
  .route('/meeting/:meetingId')
  .post(verifyJWT, replyMeeting, clickChatRoom);

router.route('/meeting/:meetingId/score').post(verifyJWT, scoreMeeting);

export default router;
