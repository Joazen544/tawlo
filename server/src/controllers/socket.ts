import { Server } from 'socket.io';
import http from 'http';

interface Users {
  [key: string]: string | number;
}

const users: Users = {};

let io: Server;

export function initSocket(server: http.Server) {
  // this function now expects an endpoint as argument
  io = new Server(server);

  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('new-user', (name) => {
      users[socket.id] = name;
      socket.broadcast.emit('user-connected', name);
    });

    socket.on('chat message', (msg) => {
      console.log(`message: ${msg}`);
      socket.broadcast.emit('chat message', {
        message: msg,
        name: users[socket.id],
      });
    });

    // socket.broadcast.emit('hi~~');

    socket.on('disconnect', () => {
      socket.broadcast.emit('user-disconnected', users[socket.id]);
      delete users[socket.id];
    });
  });
}

export function getIO() {
  if (io) {
    return io;
  }
  return null;
}
