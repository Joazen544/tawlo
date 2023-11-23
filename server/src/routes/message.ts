import { Router } from 'express';
import {
  getMoreMessages,
  clickChatRoom,
  getNativeMessageGroups,
} from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/messageGroup').get(verifyJWT, clickChatRoom);
router.route('/messageGroups').get(verifyJWT, getNativeMessageGroups);
router.route('/messages').get(verifyJWT, getMoreMessages);

export default router;
