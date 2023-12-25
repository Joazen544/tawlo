import { NextFunction, Request, Response } from 'express';

type AsyncMiddlewareFunction = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<any>;

export default (fn: AsyncMiddlewareFunction) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((err) => next(err));
  };
};
