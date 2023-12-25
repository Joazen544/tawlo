import { Request, Response } from 'express';
import * as boardModel from '../models/board';
import { ValidationError } from '../utils/errorHandler';
import catchAsync from '../utils/catchAsync';

export const getBoards = catchAsync(async (_req: Request, res: Response) => {
  const boards = await boardModel.getAllBoards();
  res.json({ boards });
});

export const getBoardName = catchAsync(async (req: Request, res: Response) => {
  const id = req.query.id as string;
  if (!id) {
    throw new ValidationError('board id is needed');
  }
  const boardInfo = await boardModel.getBoardName(id);

  if (boardInfo) {
    res.json({ name: boardInfo.name });
  } else {
    throw new Error('no such board');
  }
});
