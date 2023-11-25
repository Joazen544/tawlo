import './dotenv';
import './models/mongodb';

import express from 'express';
import http from 'http';
import path from 'path';
import cors from 'cors';
import userRouter from './routes/user';
import postRouter from './routes/post';
import messageRouter from './routes/message';
import boardRouter from './routes/board';
import { errorHandler } from './utils/errorHandler';
import { initSocket } from './controllers/socket';

const app = express();
const server = http.createServer(app);

// connect socket
initSocket(server);

app.use(cors());
app.use(express.json());

app.use('/api', [userRouter, postRouter, messageRouter, boardRouter]);

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.use(errorHandler);

server.listen(process.env.PORT, () => {
  console.log(`port running on ${process.env.PORT}`);
});
