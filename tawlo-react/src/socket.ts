import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

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

  // console.log('initting socket');

  socket.on('connect', () => {
    if (socket) socket.emit('new-user', { userId: id, name: name });
    console.log('socket connected');
  });

  if (socket) {
    window.addEventListener('beforeunload', () => {
      if (socket) socket.disconnect();
    });
  }
}

initSocket();

// export function getSocket() {
//   if (socket && socket.connected) {
//     console.log('has socket');

//     return socket;
//   } else {
//     console.log('no socket');

//     return null;
//   }
// }
