import '../dotenv';
import mongoose from 'mongoose';

mongoose
  .connect(process.env.TEST_DATABASE || 'fail', {})
  .then(() => {
    console.log('connect to mongoDB.');
  })
  .catch((err) => {
    console.log('conn failed');
    console.log(err);
  });
