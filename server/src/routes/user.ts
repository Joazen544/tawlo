import { Router } from 'express';
import * as userControl from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';
import uploadImage from '../middleware/uploadImage';
import uploadToS3 from '../middleware/uploadToS3';

const router = Router();

router.route('/user/signup').post(uploadImage, uploadToS3, userControl.signUp);
router.route('/user/signin').post(userControl.signIn);
router.route('/user/read').post(verifyJWT, userControl.updateUserRead);
router.route('/user/info').get(userControl.getUserInfo);
router
  .route('/user/image')
  .post(uploadImage, uploadToS3, verifyJWT, userControl.changeImage);
router.route('/user/relation').get(verifyJWT, userControl.getUserRelation);
router.route('/user/request').post(verifyJWT, userControl.sendRequest);
router.route('/user/request/refuse').post(verifyJWT, userControl.refuseRequest);
router.route('/user/request/cancel').post(verifyJWT, userControl.cancelRequest);
router.route('/user/notification').get(verifyJWT, userControl.getNotifications);
router
  .route('/user/notification')
  .post(verifyJWT, userControl.readAllNotifications);
router.route('/user/friends').get(verifyJWT, userControl.getFriendsList);
router.route('/user/friends/all').get(verifyJWT, userControl.getAllFriendsList);
router.route('/user/preference').get(verifyJWT, userControl.getUserPreference);

export default router;
