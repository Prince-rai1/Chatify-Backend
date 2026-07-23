import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { messageSchema } from "../schemas/MessageSchema/MessageSchema.js";
import { io, userSocketMap } from "../socket/socket.js";

export const getMessages = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  const { id: userToChatId } = req?.params;

  const messages = await Message.find({
    $or: [
      { sender: userId, receiver: userToChatId },
      { sender: userToChatId, receiver: userId },
    ],
  });

  res.status(200).json({
    success: true,
    message: "All messages fetched successfully",
    data: messages,
  });
});

export const sendMessage = asyncHandler(async (req, res) => {
  const result = messageSchema.safeParse(req.body);
  const senderId = req.user?._id;
  const { id: receiverId } = req.params;

  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: result.error,
    });
  }

  const { message } = result.data;
  const imageFiles = req.files || [];   

  const receiver = await User.findById(receiverId);

  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: "Receiver not found.",
    });
  }

  if (!message && imageFiles.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Please send a message or at least one image.",
    });
  }

  const uploadResults = await Promise.all(
    imageFiles.map((file) => uploadOnCloudinary(file.buffer)),
  );

  const images = uploadResults
    .filter(Boolean)
    .map((uploaded) => ({
      url: uploaded.secure_url,
      public_id: uploaded.public_id,
    }));

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message: message || "",
    images,
  });

  const receiverSocketId = userSocketMap.get(receiver._id.toString());

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("new-message", newMessage);
  }

  return res.status(201).json({
    success: true,
    message: "Message sent successfully.",
    data: newMessage,
  });
});

export const getChatPartners = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  const chats = await Message.aggregate([
    {
      $match: {
        $or: [
          { sender: currentUserId },
          { receiver: currentUserId },
        ],
      },
    },

    {
      $sort: {
        createdAt: -1,
      },
    },

    {
      $addFields: {
        partnerId: {
          $cond: [
            { $eq: ["$sender", currentUserId] },
            "$receiver",
            "$sender",
          ],
        },
      },
    },

    {
      $group: {
        _id: "$partnerId",

        lastMessage: {
          $first: "$message",
        },

        lastMessageTime: {
          $first: "$createdAt",
        },

        lastImages: {
          $first: "$images",
        },

        unreadCount: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$receiver", currentUserId] },
                  { $eq: ["$isSeen", false] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $unwind: "$user",
    },

    {
      $project: {
        _id: "$user._id",
        fullname: "$user.fullname",
        username: "$user.username",
        profilePicture: "$user.profilePicture",

        lastMessage: 1,
        lastMessageTime: 1,
        lastImages: 1,
        unreadCount: 1,
      },
    },

    {
      $sort: {
        lastMessageTime: -1,
      },
    },
  ]);

  return res.status(200).json({
    success: true,
    message: "Chats fetched successfully.",
    data: chats,
  });
});
