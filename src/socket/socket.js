import { Server } from "socket.io";
import Message from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";

let io;

const userSocketMap = new Map();

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "http://localhost:5173",
      credentials: true,
    },
  });

  console.log("Socket.IO initialized");

  io.on("connection", (socket) => {
    console.log(`New Connection: ${socket.id}`);

    socket.on("user-connected", (userId) => {
      socket.userId = userId;

      userSocketMap.set(userId, socket.id);

      emitOnlineUsers();

      console.log(userSocketMap);
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        userSocketMap.delete(socket.userId);
      }
      emitOnlineUsers();

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

        console.log(socket.userId)

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
