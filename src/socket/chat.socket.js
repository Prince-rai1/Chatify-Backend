import Message from "../models/message.model.js";
import { io, userSocketMap } from "./socket.js";

export const registerChatEvents = (socket) => {
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
        }
      );

      const senderSocketId = userSocketMap.get(chatUserId.toString());

      if (senderSocketId) {
        io.to(senderSocketId).emit("messages-seen", {
          seenBy: socket.userId,
        });
      }
    } catch (error) {
      console.error("Error marking messages as seen:", error);
    }
  });
};