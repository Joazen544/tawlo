import { Router } from 'express';
import {
  signUp,
  signIn,
  updateUserRead,
  getUserName,
  getUserRelation,
  sendRequest,
} from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/user/signup').post(signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);
router.route('/user/name').get(getUserName);
router.route('/user/relation').get(verifyJWT, getUserRelation);
router.route('/user/request').post(verifyJWT, sendRequest);

export default router;
