import { Server as SocketIOServer } from "socket.io";
import http from "http";
import { logger } from "./utils/logger.js";

export const initSocketServer = (server: http.Server) => {

    const io = new SocketIOServer(server);

    io.engine.on("connection_error", (err: any) => {
        logger.warn("socket_connection_error", { message: err?.message });
    });

    io.on("connection", (socket) => {
    logger.info("socket_connected", { socketId: socket.id });

    //Listen for Notification Event from the Server
    socket.on("notification", (data) => {
        //Bradcast the notification data to the all connected clients(admin dashboard)
      //socket.broadcast.emit() ---> m-op
      logger.info("socket_notification", { type: data?.type });
      io.emit("newNotification", data);
    });

    socket.on("disconnect", (reason) => {
      logger.info("socket_disconnected", { socketId: socket.id, reason });
    });
  });
};