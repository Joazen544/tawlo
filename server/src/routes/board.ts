import { Router } from 'express';
import { getBoards, getBoardName } from '../controllers/board';

const router = Router();

// to get all the boards
router.route('/boards').get(getBoards);
router.route('/board/name').get(getBoardName);

export default router;
