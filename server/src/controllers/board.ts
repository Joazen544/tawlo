import { NextFunction, Request, Response } from 'express';
import { getAllBoardsFromDB } from '../models/board';

export async function getBoards(
  _req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const boards = await getAllBoardsFromDB();
    res.json({ boards });
  } catch (err) {
    next(err);
  }
}

export async function createBoard() {
  return 0;
}
