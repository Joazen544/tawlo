import { Router } from 'express';
import {
  signUp,
  signIn,
  updateUserRead,
  getUserName,
} from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/user/signup').post(signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);
router.route('/user/name').get(getUserName);

export default router;
