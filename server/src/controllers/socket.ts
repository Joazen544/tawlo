import { Server } from 'socket.io';
import http from 'http';

interface UserConnected {
  [userId: string]: string[];
}

interface SocketConnected {
  [socketId: string]: {
    userId: string;
    name: string;
  };
}

const usersConnected: UserConnected = {};
const socketsConnected: SocketConnected = {};
let usersId: string[] = [];

let io: Server;

export function initSocket(server: http.Server) {
  // this function now expects an endpoint as argument
  io = new Server(server);

  io.on('connection', (socket) => {
    console.log('a user connected');
    if (usersId) socket.emit('now-users', `These users are online: ${usersId}`);

    socket.on('new-user', (data) => {
      if (usersConnected[data.userId]) {
        usersConnected[data.userId].push(socket.id);
      } else {
        usersConnected[data.userId] = [socket.id];
        usersId.push(data.userId);
      }

      socketsConnected[socket.id] = { userId: data.userId, name: data.name };
      socket.broadcast.emit(
        'new-user',
        `New user ${data.name} joined. Now connecting users: ${usersId}`,
      );
      console.log(`User connected now: ${usersId}`);
    });

    socket.on('chat message', (msg) => {
      socket.broadcast.emit('chat message', {
        message: msg,
        name: socketsConnected[socket.id].name,
      });
    });

    socket.on('disconnect', () => {
      let userSocketIdsArray;
      if (socketsConnected[socket.id]) {
        userSocketIdsArray = usersConnected[socketsConnected[socket.id].userId];
      }

      if (userSocketIdsArray && userSocketIdsArray.length > 1) {
        // more than 1 socket id recorded in this user
        userSocketIdsArray = userSocketIdsArray.filter(
          (socketId) => socketId !== socket.id,
        );
      } else {
        delete usersConnected[socketsConnected[socket.id].userId];
      }
      usersId = usersId.filter(
        (id) => id !== socketsConnected[socket.id].userId,
      );
      console.log(socketsConnected[socket.id].userId);

      socket.broadcast.emit(
        'user-disconnected',
        `someone disconnected, the users remain now: ${usersId || null}`,
      );
      console.log(
        `someone disconnected, the users remain now: ${usersId || null}`,
      );

      delete socketsConnected[socket.id];
    });
  });
}

export function getIO() {
  if (io) {
    return io;
  }
  return null;
}
