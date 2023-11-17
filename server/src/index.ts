import './dotenv';
import './models/mongodb';
import express from 'express';
import userRouter from './routes/user';

const app = express();
app.use(express.json());

app.use('/api', [userRouter]);

app.get('/', (_req, res) => {
  res.send('app running');
});

app.listen(process.env.PORT, () => {
  console.log('port running on 3000');
});
