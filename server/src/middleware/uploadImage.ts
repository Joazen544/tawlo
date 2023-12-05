import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: (_req, file, cb) => {
    if (file.fieldname === 'user_image') {
      cb(null, `${__dirname}/../../public/userImage`);
    }
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 104857 },
}).fields([
  {
    name: 'user_image',
    maxCount: 1,
  },
]);

export default upload;
