import { NextFunction, Request, Response } from 'express';
import { getAllBoardsFromDB, getBoardNameFromDB } from '../models/board';
import { ValidationError } from '../utils/errorHandler';
import catchAsync from '../utils/catchAsync';

export const getBoards = catchAsync(async (_req: Request, res: Response) => {
  const boards = await getAllBoardsFromDB();
  res.json({ boards });
});

export const getBoardName = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
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
  },
);
