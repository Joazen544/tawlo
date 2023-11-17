import { Router } from 'express';
import { userSignup } from '../controllers/user.js';

const router = Router();

router.route('/user/signup').post(userSignup);

export default router;
