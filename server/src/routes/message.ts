import { Router } from 'express';
import * as messageControl from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/messageGroup').get(verifyJWT, messageControl.clickChatRoom);
router.route('/messageGroups').get(verifyJWT, messageControl.getMessageGroups);
router.route('/messages').get(verifyJWT, messageControl.getMoreMessages);
router.route('/message').post(verifyJWT, messageControl.sendMessage);
router.route('/messageGroup/read').post(verifyJWT, messageControl.readMessages);

export default router;
