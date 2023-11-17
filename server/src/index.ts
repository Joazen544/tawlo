import './dotenv';
import express from 'express';
import userRouter from './routes/user';

const app = express();
app.use(express.json());

app.use('api', [userRouter]);

app.get('/', (req, res) => {
  res.send(req.body);
});

app.listen(process.env.PORT, () => {
  console.log('port running on 3000');
});
