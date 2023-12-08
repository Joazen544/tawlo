import { NextFunction, Request, Response } from 'express';
import { verify } from '../utils/JWT';

interface JwtData {
  userId: string;
  iat: number;
  exp: number;
}

export default async function (
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const authHeader = req.headers.authorization;
  console.log(req);

  if (!authHeader) {
    next(new Error('No auth!!'));
  }
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    next(new Error('No token!!'));
  } else {
    verify(token)
      .then((data) => {
        const userInfo = data as JwtData;

        req.body.user = userInfo.userId;
        next();
      })
      .catch((err) => {
        next(err);
      });
  }
}
