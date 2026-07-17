import { Server } from "socket.io";
import Message from "../models/message.model.js";

let io;

const userSocketMap = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URI,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    socket.on("user-connected", (userId) => {
      socket.userId = userId;

      userSocketMap.set(userId, socket.id);

      emitOnlineUsers();

      console.log(userSocketMap);
    });

    socket.on("disconnect", () => {
      if (socket.userId && userSocketMap.get(socket.userId) === socket.id) {
        userSocketMap.delete(socket.userId);
        emitOnlineUsers();
      }
      console.log(`Disconnected: ${socket.id}`);
    });

    socket.on("mark-chat-seen", async ({ chatUserId }) => {
      if (!chatUserId) return;

      try {
        await Message.updateMany(
          {
            sender: chatUserId,
            receiver: socket.userId,
            isSeen: false,
          },
          {
            $set: {
              isSeen: true,
            },
          },
        );

        const senderSocketId = userSocketMap.get(chatUserId?.toString());

        if (senderSocketId) {
          io.to(senderSocketId).emit("messages-seen", {
            seenBy: socket.userId,
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
  });

  const emitOnlineUsers = () => {
    io.emit("online-users", [...userSocketMap.keys()]);
  };
};

export { initializeSocket, io, userSocketMap };
