import mongoose from 'mongoose';
import 'dotenv';

const conn = mongoose
  .connect(process.env.DATABASE || 'fail', {})
  .then(() => {
    console.log('connect to mongoDB.');
  })
  .catch((err) => {
    console.log('conn failed');
    console.log(err);
  });

export default conn;
