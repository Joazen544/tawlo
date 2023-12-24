import { Server } from 'socket.io';
import http from 'http';
import { verify } from '../utils/JWT';
import { getUserFriends } from '../models/user';
import redisClient from '../utils/redis';

interface UserConnected {
  [userId: string]: { socketId: string[]; friends: string[] };
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

    socket.on('new-user', async (data) => {
      if (usersConnected[data.userId]) {
        usersConnected[data.userId].socketId.push(socket.id);
      } else {
        usersConnected[data.userId] = { socketId: [], friends: [] };

        usersConnected[data.userId].socketId = [socket.id];
        usersConnected[data.userId].friends = data.friends;
        usersId.push(data.userId);
        socket.broadcast.emit('new-user', data.userId);
      }

      socketsConnected[socket.id] = { userId: data.userId, name: data.name };
      await socket.join(data.userId);
      // give the new user the whole online list
      socket.emit('all-users-online', usersId);
      console.log(`User connected now: ${usersId}`);

      // get user friends and notify them
      try {
        const friendsArray = await getUserFriends(data.userId);
        redisClient.set(`${data.userId}friends`, JSON.stringify(friendsArray));
        const onlineFriends: string[] = [];
        friendsArray.forEach((friendId) => {
          socket.to(friendId.toString()).emit('friend-online', data.userId);
          if (usersConnected[friendId.toString()]) {
            onlineFriends.push(friendId.toString());
          }
        });

        io.to(data.userId).emit('friends', onlineFriends);
      } catch (err) {
        console.log(err);
        console.log('something wrong getting friends from DB and notify them');
      }
    });

    socket.on('chat message', async (messageData: MessageData) => {
      console.log('receiving message!!');

      try {
        socket.broadcast.to(messageData.from).emit('myself', {
          message: messageData.content,
          from: messageData.from,
          name: socketsConnected[socket.id].name,
          group: messageData.group,
        });

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

    socket.on('disconnect', async () => {
      try {
        if (
          usersConnected[socketsConnected[socket.id].userId] &&
          usersConnected[socketsConnected[socket.id].userId].socketId.length > 1
        ) {
          // more than 1 socket id recorded in this user
          console.log('a socket disconnected');

          usersConnected[socketsConnected[socket.id].userId].socketId =
            usersConnected[socketsConnected[socket.id].userId].socketId.filter(
              (socketId) => socketId !== socket.id,
            );
        } else {
          delete usersConnected[socketsConnected[socket.id].userId];
          usersId = usersId.filter(
            (id) => id !== socketsConnected[socket.id].userId,
          );

          const friendsArrayString = await redisClient.get(
            `${socketsConnected[socket.id].userId}friends`,
          );
          if (!friendsArrayString) {
            return;
          }
          const friendsArray = JSON.parse(friendsArrayString);
          friendsArray.forEach((friendId: string) => {
            socket
              .to(friendId)
              .emit('friend-offline', socketsConnected[socket.id].userId);
          });
          redisClient.DEL(`${socketsConnected[socket.id].userId}friends`);
        }

        // tell every other user who disconnected

        delete socketsConnected[socket.id];
      } catch (err) {
        console.log(err);
      }
    });
  });
}

export function sendMessageThroughSocket(
  user: string,
  content: string,
  messageTo: string,
  messageGroup: string,
) {
  if (!io) {
    throw new Error('socket io not working');
  }
  io.to(user).emit('myself', {
    message: content,
    group: messageGroup,
  });

  io.to(messageTo).emit('message', {
    message: content,
    from: user,
    group: messageGroup,
  });
}

export function sendNotificationThroughSocket(
  targetUser: string,
  category: string,
  message: string,
  actionUser: string | undefined,
  targetPost: string | undefined,
) {
  if (!io) {
    throw new Error('socket io not working');
  }

  io.to(targetUser).emit('notificate', {
    category,
    message,
    actionUser,
    targetPost,
  });

  if (['meet_match', 'meet_success', 'meet_fail'].includes(category)) {
    io.to(targetUser).emit('notificate_2', {
      category,
      message,
      actionUser,
      targetPost,
    });
  }

  return true;
}

export function getIO() {
  if (io) {
    return io;
  }
  return null;
}
