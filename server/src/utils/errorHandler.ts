import { NextFunction, Request, Response } from 'express';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.message = message;
    this.name = 'ValidationError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
) {
  console.error(err);
  if (err instanceof ValidationError) {
    res.status(400).json({ type: err.name, errors: err.message });
    return;
  }
  if (err instanceof Error) {
    res.status(500).json({ type: 'server problem', errors: err.message });
    return;
  }
  res.status(500).send('Oops, unknown error');
}
