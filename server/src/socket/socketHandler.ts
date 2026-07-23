import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import { env } from '../config/env';

let ioInstance: Server | null = null;

export const initSocket = (httpServer: HttpServer): Server => {
  ioInstance = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true
    }
  });

  ioInstance.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) {
      return next(new Error('Authentication token required'));
    }
    try {
      const decoded = verifyToken(token);
      (socket as any).user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid socket connection token'));
    }
  });

  ioInstance.on('connection', (socket: Socket) => {
    const user = (socket as any).user;
    if (user) {
      // Join personal room for caller real-time updates
      socket.join(`user:${user.id}`);

      // If admin, join admin room
      if (user.role === 'admin') {
        socket.join('admin_room');
      }
      console.log(`[Socket] User ${user.email} (${user.role}) connected`);
    }

    socket.on('disconnect', () => {
      console.log(`[Socket] Client disconnected: ${socket.id}`);
    });
  });

  return ioInstance;
};

export const getIO = (): Server => {
  if (!ioInstance) {
    throw new Error('Socket.io has not been initialized');
  }
  return ioInstance;
};

export const emitToUser = (userId: string, event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to(`user:${userId}`).emit(event, payload);
  }
};

export const emitToAdmin = (event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.to('admin_room').emit(event, payload);
  }
};

export const emitToAll = (event: string, payload: any) => {
  if (ioInstance) {
    ioInstance.emit(event, payload);
  }
};
