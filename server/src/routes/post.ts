import { Router } from 'express';
import { createPost } from '../controllers/post';

const router = Router();

router.route('/post').post(createPost);

export default router;
