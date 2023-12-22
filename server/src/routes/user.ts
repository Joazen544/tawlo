import { Router } from 'express';
import {
  signUp,
  signIn,
  updateUserRead,
  // getUserName,
  getUserRelation,
  sendRequest,
  cancelRequest,
  getNotifications,
  readAllNotifications,
  // getUserImage,
  changeImage,
  getFriendsList,
  getAllFriendsList,
  getUserInfo,
  refuseRequest,
} from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';
import uploadImage from '../middleware/uploadImage';
import uploadToS3 from '../middleware/uploadToS3';

const router = Router();

router.route('/user/signup').post(uploadImage, uploadToS3, signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);
router.route('/user/info').get(getUserInfo);
router
  .route('/user/image')
  .post(uploadImage, uploadToS3, verifyJWT, changeImage);
router.route('/user/relation').get(verifyJWT, getUserRelation);
router.route('/user/request').post(verifyJWT, sendRequest);
router.route('/user/request/refuse').post(verifyJWT, refuseRequest);
router.route('/user/request/cancel').post(verifyJWT, cancelRequest);
router.route('/user/notification').get(verifyJWT, getNotifications);
router.route('/user/notification').post(verifyJWT, readAllNotifications);
router.route('/user/friends').get(verifyJWT, getFriendsList);
router.route('/user/friends/all').get(verifyJWT, getAllFriendsList);

export default router;
