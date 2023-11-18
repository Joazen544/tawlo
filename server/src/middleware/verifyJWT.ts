import { NextFunction, Request, Response } from 'express';
import { verifyJWT } from '../utils/JWT';

export default async function (
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    next(new Error('No auth!!'));
  }
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    next(new Error('No token!!'));
  } else {
    verifyJWT(token)
      .then((user) => {
        req.body.user = user;
        next();
      })
      .catch((err) => {
        next(err);
      });
  }
}
