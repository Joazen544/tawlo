"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendNotificationThroughSocket = exports.sendMessageThroughSocket = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
const JWT_1 = require("../utils/JWT");
const user_1 = require("../models/user");
const redis_1 = __importDefault(require("../utils/redis"));
const usersConnected = {};
const socketsConnected = {};
let usersId = [];
let io;
function initSocket(server) {
    // this function now expects an endpoint as argument
    io = new socket_io_1.Server(server, {
        cors: {
            origin: '*',
        },
    });
    console.log('socket io connect');
    io.use((socket, next) => __awaiter(this, void 0, void 0, function* () {
        if (socket.handshake.auth && socket.handshake.auth.token) {
            const token = socket.handshake.auth.token.split(' ')[1];
            (0, JWT_1.verify)(token)
                .then(() => {
                console.log('token sucess');
                next();
            })
                .catch((err) => {
                console.log('token fail');
                next(err);
            });
        }
        else {
            next(new Error('Authentication error'));
        }
    })).on('connection', (socket) => {
        console.log('a user connected');
        if (usersId)
            socket.emit('now-users', `These users are online: ${usersId}`);
        socket.on('new-user', (data) => __awaiter(this, void 0, void 0, function* () {
            if (usersConnected[data.userId]) {
                usersConnected[data.userId].socketId.push(socket.id);
            }
            else {
                usersConnected[data.userId] = { socketId: [], friends: [] };
                usersConnected[data.userId].socketId = [socket.id];
                usersConnected[data.userId].friends = data.friends;
                usersId.push(data.userId);
                socket.broadcast.emit('new-user', data.userId);
            }
            socketsConnected[socket.id] = { userId: data.userId, name: data.name };
            yield socket.join(data.userId);
            // give the new user the whole online list
            socket.emit('all-users-online', usersId);
            console.log(`User connected now: ${usersId}`);
            // get user friends and notify them
            try {
                const friendsArray = yield (0, user_1.getUserFriends)(data.userId);
                redis_1.default.set(`${data.userId}friends`, JSON.stringify(friendsArray));
                const onlineFriends = [];
                friendsArray.forEach((friendId) => {
                    socket.to(friendId.toString()).emit('friend-online', data.userId);
                    if (usersConnected[friendId.toString()]) {
                        onlineFriends.push(friendId.toString());
                    }
                });
                io.to(data.userId).emit('friends', onlineFriends);
            }
            catch (err) {
                console.log(err);
                console.log('something wrong getting friends from DB and notify them');
            }
        }));
        socket.on('chat message', (messageData) => __awaiter(this, void 0, void 0, function* () {
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
            }
            catch (err) {
                console.log('something wrong sending message');
            }
        }));
        socket.on('disconnect', () => __awaiter(this, void 0, void 0, function* () {
            try {
                if (usersConnected[socketsConnected[socket.id].userId] &&
                    usersConnected[socketsConnected[socket.id].userId].socketId.length > 1) {
                    // more than 1 socket id recorded in this user
                    console.log('a socket disconnected');
                    usersConnected[socketsConnected[socket.id].userId].socketId =
                        usersConnected[socketsConnected[socket.id].userId].socketId.filter((socketId) => socketId !== socket.id);
                }
                else {
                    delete usersConnected[socketsConnected[socket.id].userId];
                    usersId = usersId.filter((id) => id !== socketsConnected[socket.id].userId);
                    const friendsArrayString = yield redis_1.default.get(`${socketsConnected[socket.id].userId}friends`);
                    if (!friendsArrayString) {
                        return;
                    }
                    const friendsArray = JSON.parse(friendsArrayString);
                    friendsArray.forEach((friendId) => {
                        socket
                            .to(friendId)
                            .emit('friend-offline', socketsConnected[socket.id].userId);
                    });
                    redis_1.default.DEL(`${socketsConnected[socket.id].userId}friends`);
                }
                // tell every other user who disconnected
                delete socketsConnected[socket.id];
            }
            catch (err) {
                console.log(err);
            }
        }));
    });
}
exports.initSocket = initSocket;
function sendMessageThroughSocket(user, content, messageTo, messageGroup) {
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
exports.sendMessageThroughSocket = sendMessageThroughSocket;
function sendNotificationThroughSocket(targetUser, category, message, actionUser, targetPost) {
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
exports.sendNotificationThroughSocket = sendNotificationThroughSocket;
// export function getIO() {
//   if (io) {
//     return io;
//   }
//   return null;
// }
