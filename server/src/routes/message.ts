import { Router } from 'express';
import {
  getMoreMessages,
  clickChatRoom,
  getNativeMessageGroups,
  sendMessage,
  readMessages,
} from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/messageGroup').get(verifyJWT, clickChatRoom);
router.route('/messageGroups').get(verifyJWT, getNativeMessageGroups);
router.route('/messages').get(verifyJWT, getMoreMessages);
router.route('/message').post(verifyJWT, sendMessage);
router.route('/messageGroup/read').post(verifyJWT, readMessages);

export default router;
