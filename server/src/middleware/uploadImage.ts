import multer from 'multer';
import path from 'path';

const store = multer.diskStorage({
  destination: (_req, _file, cb) => {
    console.log('storing image 1');

    console.log('storing image');

    cb(null, `${__dirname}/../../public/userImage`);
  },
  filename: (_req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: store,
  // limits: { fileSize: 104857 },
}).single('image');

export default upload;
