import { Router } from 'express';
import {
  getMessage,
  getMessageGroup,
  getNativeMessageGroups,
} from '../controllers/message';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/messageGroup').get(verifyJWT, getMessageGroup);
router.route('/messageGroups').get(verifyJWT, getNativeMessageGroups);
router.route('/messages').get(verifyJWT, getMessage);

export default router;
