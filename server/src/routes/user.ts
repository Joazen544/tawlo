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
  readAllNotifications,
  getUserImage,
  changeImage,
} from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';
import uploadImage from '../middleware/uploadImage';
import uploadToS3 from '../middleware/uploadToS3';

const router = Router();

// router.route('/user/upload').post(uploadImage, uploadToS3);
router.route('/user/signup').post(uploadImage, uploadToS3, signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);
router.route('/user/name').get(getUserName);
router.route('/user/image').get(getUserImage);
router
  .route('/user/image')
  .post(uploadImage, uploadToS3, verifyJWT, changeImage);
router.route('/user/relation').get(verifyJWT, getUserRelation);
router.route('/user/request').post(verifyJWT, sendRequest);
router.route('/user/cancelRequest').post(verifyJWT, cancelRequest);
router.route('/user/notification').get(verifyJWT, getNotifications);
router.route('/user/notification').post(verifyJWT, readAllNotifications);

export default router;
