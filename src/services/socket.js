import { io } from 'socket.io-client';

export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socketInstance;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      autoConnect: false,
      transports: ['websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500
    });
  }
  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = undefined;
  }
};
