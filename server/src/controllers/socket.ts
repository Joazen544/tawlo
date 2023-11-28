import { Server } from 'socket.io';
import http from 'http';
// import { createMessage } from './message';
import { verify } from '../utils/JWT';

interface UserConnected {
  [userId: string]: string[];
}

interface SocketConnected {
  [socketId: string]: {
    userId: string;
    name: string;
  };
}

export interface MessageData {
  from: string;
  to: string;
  group: string;
  content: string;
}

const usersConnected: UserConnected = {};
const socketsConnected: SocketConnected = {};
let usersId: string[] = [];

let io: Server;

export function initSocket(server: http.Server) {
  // this function now expects an endpoint as argument
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });
  console.log('socket io connect');

  io.use(async (socket, next) => {
    if (socket.handshake.auth && socket.handshake.auth.token) {
      const token = socket.handshake.auth.token.split(' ')[1];

      verify(token)
        .then(() => {
          console.log('token sucess');
          next();
        })
        .catch((err) => {
          console.log('token fail');

          next(err);
        });
    } else {
      next(new Error('Authentication error'));
    }
  }).on('connection', (socket) => {
    console.log('a user connected');
    if (usersId) socket.emit('now-users', `These users are online: ${usersId}`);

    socket.on('new-user', (data) => {
      if (usersConnected[data.userId]) {
        usersConnected[data.userId].push(socket.id);
      } else {
        usersConnected[data.userId] = [socket.id];
        usersId.push(data.userId);
        socket.broadcast.emit('new-user', data.userId);
      }

      socketsConnected[socket.id] = { userId: data.userId, name: data.name };
      socket.join(data.userId);
      // give the new user the whole online list
      socket.emit('all-users-online', usersId);
      console.log(`User connected now: ${usersId}`);
    });

    socket.on('chat message', async (messageData: MessageData) => {
      console.log('receiving message!!');
      console.log(messageData.to);

      try {
        socket.broadcast.to(messageData.from).emit('myself', {
          message: messageData.content,
          from: messageData.from,
          name: socketsConnected[socket.id].name,
          group: messageData.group,
        });

        // await createMessage(
        //   messageData.group,
        //   messageData.from,
        //   messageData.content,
        // );

        socket.broadcast.to(messageData.to).emit('message', {
          message: messageData.content,
          from: messageData.from,
          name: socketsConnected[socket.id].name,
          group: messageData.group,
        });
      } catch (err) {
        console.log('something wrong sending message');
      }
    });

    socket.on('disconnect', () => {
      try {
        if (
          usersConnected[socketsConnected[socket.id].userId] &&
          usersConnected[socketsConnected[socket.id].userId].length > 1
        ) {
          // more than 1 socket id recorded in this user
          console.log('peeee');

          usersConnected[socketsConnected[socket.id].userId] = usersConnected[
            socketsConnected[socket.id].userId
          ].filter((socketId) => socketId !== socket.id);
        } else {
          delete usersConnected[socketsConnected[socket.id].userId];
          usersId = usersId.filter(
            (id) => id !== socketsConnected[socket.id].userId,
          );
          socket.broadcast.emit(
            'user-disconnected',
            socketsConnected[socket.id].userId,
          );
          console.log(
            `someone disconnected, the users remain now: ${usersId || null}`,
          );
        }

        // tell every other user who disconnected

        delete socketsConnected[socket.id];
      } catch (err) {
        console.log(err);
      }
    });
  });
}

export function getIO() {
  if (io) {
    return io;
  }
  return null;
}
