import { Request, Response, NextFunction } from 'express';
import upload from '../models/s3';

const uploadFilesToS3 = async (
  req: Request,
  _res: Response,
  next: NextFunction,
) => {
  try {
    if (req.file) {
      const userImageFile = req.file;

      upload(userImageFile, 'user-image');
    }

    next();
  } catch (err) {
    console.log('something is wrong uploading image');
    next(err);
  }
};

export default uploadFilesToS3;
