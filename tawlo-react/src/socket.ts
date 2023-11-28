import { io } from 'socket.io-client';
import Cookies from 'js-cookie';

const URL = 'http://localhost:3000';
const token = Cookies.get('jwtToken');

export const socket = io(URL, {
  auth: {
    token: `Bearer ${token}`,
  },
});

socket.on('connect', () => {
  console.log('socket connected');
});
