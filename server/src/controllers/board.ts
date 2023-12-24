import { NextFunction, Request, Response } from 'express';
import { getAllBoardsFromDB, getBoardNameFromDB } from '../models/board';
import { ValidationError } from '../utils/errorHandler';

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

export async function getBoardName(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const id = req.query.id as string;
    if (!id) {
      next(new ValidationError('board id is needed'));
    }
    const boardInfo = await getBoardNameFromDB(id);

    if (boardInfo) {
      res.json({ name: boardInfo.name });
    } else {
      next(new Error('no such board'));
    }
  } catch (err) {
    next(err);
  }
}
