import { Router } from 'express';
import { signUp, signIn, updateUserRead } from '../controllers/user';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/user/signup').post(signUp);
router.route('/user/signin').post(signIn);
router.route('/user/read').post(verifyJWT, updateUserRead);

export default router;
