import { Router } from 'express';
import * as meetingControl from '../controllers/meeting';
import { clickChatRoom } from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/meeting').post(verifyJWT, meetingControl.accessMeeting);
router.route('/meeting').delete(verifyJWT, meetingControl.cancelMeeting);
router.route('/meeting').get(verifyJWT, meetingControl.getMeeting);
router
  .route('/meeting/:meetingId')
  .post(verifyJWT, meetingControl.replyMeeting, clickChatRoom);

router
  .route('/meeting/:meetingId/score')
  .post(verifyJWT, meetingControl.scoreMeeting);
router.route('/meeting/share').get(meetingControl.getSharings);
router.route('/meeting/ask').get(meetingControl.getAskings);

export default router;
