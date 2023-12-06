import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const URL = import.meta.env.VITE_SOCKET_URL;
const token = Cookies.get('jwtToken');
const id = Cookies.get('userId');
const name = Cookies.get('userName');

export const socket = io(URL, {
  auth: {
    token: `Bearer ${token}`,
  },
  forceNew: true,
});

socket.on('connect', () => {
  socket.emit('new-user', { userId: id, name: name });
  console.log('socket connected');
});
