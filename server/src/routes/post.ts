import { Router } from 'express';
import { createPost } from '../controllers/post';
import verifyJWT from '../middleware/verifyJWT';

const router = Router();

router.route('/post').post(verifyJWT, createPost);

export default router;
