import { Router } from 'express';
import { signUp } from '../controllers/user.js';

const router = Router();

router.route('/user/signup').post(signUp);

export default router;
