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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getIO = exports.initSocket = void 0;
const socket_io_1 = require("socket.io");
// import { createMessage } from './message';
const JWT_1 = require("../utils/JWT");
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
        socket.on('new-user', (data) => {
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
            socket.join(data.userId);
            // give the new user the whole online list
            socket.emit('all-users-online', usersId);
            console.log(`User connected now: ${usersId}`);
        });
        socket.on('chat message', (messageData) => __awaiter(this, void 0, void 0, function* () {
            console.log('receiving message!!');
            // console.log(messageData.to);
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
        socket.on('disconnect', () => {
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
                    socket.broadcast.emit('user-disconnected', socketsConnected[socket.id].userId);
                    console.log(`someone disconnected, the users remain now: ${usersId || null}`);
                }
                // tell every other user who disconnected
                delete socketsConnected[socket.id];
            }
            catch (err) {
                console.log(err);
            }
        });
    });
}
exports.initSocket = initSocket;
function getIO() {
    if (io) {
        return io;
    }
    return null;
}
exports.getIO = getIO;
