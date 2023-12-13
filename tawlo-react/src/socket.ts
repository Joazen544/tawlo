import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import axios from 'axios';

export let socket: Socket | null;

export async function initSocket() {
  const URL = import.meta.env.VITE_SOCKET_URL;
  const token = Cookies.get('jwtToken');
  const id = Cookies.get('userId');
  const name = Cookies.get('userName');
  socket = io(URL, {
    auth: {
      token: `Bearer ${token}`,
    },
  });

  socket.on('connect', () => {
    console.log('socket connected');

    if (socket) {
      axios
        .get(`${import.meta.env.VITE_DOMAIN}/api/user/friends`, {
          headers: {
            authorization: `Bearer ${token}`,
          },
        })
        .then((res) => {
          const friendsArray = res.data;
          if (socket) {
            socket.emit('new-user', {
              userId: id,
              name: name,
              friends: friendsArray,
            });
          }
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });

  if (socket) {
    window.addEventListener('beforeunload', () => {
      if (socket) socket.disconnect();
    });
  }
}

initSocket();
