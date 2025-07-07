import { Server as SocketIOServer } from "socket.io";

let io: SocketIOServer;

export const setSocketIOInstance = (instance: SocketIOServer) => {
  io = instance;
};

export const getSocketIOInstance = (): SocketIOServer => {
  if (!io) {
    throw new Error("Socket.IO instance not set yet.");
  }
  return io;
};
