import './dotenv';
import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.send(req.body);
});

app.listen(3000, () => {
  console.log('port running on 3000');
});
