import { Router } from 'express';
import { signUp, signIn } from '../controllers/user';

const router = Router();

router.route('/user/signup').post(signUp);
router.route('/user/signin').post(signIn);

export default router;
