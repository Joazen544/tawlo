import { Router } from 'express';
import { getBoards } from '../controllers/board';

const router = Router();

// to get all the boards
router.route('/boards').get(getBoards);

export default router;
