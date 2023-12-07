import { Router } from 'express';
import {
  signUp,
  signIn,
  updateUserRead,
  getUserName,
  getUserRelation,
  sendRequest,
  cancelRequest,
  getNotifications,
} from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';
// import upload from '../middleware/uploadImage';

const router = Router();

router.route('/user/signup').post(signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);
router.route('/user/name').get(getUserName);
router.route('/user/relation').get(verifyJWT, getUserRelation);
router.route('/user/request').post(verifyJWT, sendRequest);
router.route('/user/cancelRequest').post(verifyJWT, cancelRequest);
router.route('/user/notification').get(verifyJWT, getNotifications);

export default router;
