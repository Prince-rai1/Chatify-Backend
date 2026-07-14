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

  const imageBuffer = req.file?.buffer;

  // Receiver exists or not
  const receiver = await User.findById(receiverId);

  if (!receiver) {
    return res.status(404).json({
      success: false,
      message: "Receiver not found.",
    });
  }

  // Message ya Image me se ek hona chahiye
  if (!message && !imageBuffer) {
    return res.status(400).json({
      success: false,
      message: "Please send a message or an image.",
    });
  }

  let imageUrl = "";
  let public_id = "";

  if (imageBuffer) {
    const uploadedImage = await uploadOnCloudinary(
      imageBuffer,
      req.file.originalname,
    );

    imageUrl = uploadedImage?.secure_url || "";

    public_id = uploadedImage?.public_id || "";
  }

  const newMessage = await Message.create({
    sender: senderId,
    receiver: receiverId,
    message: message || "",
    image: {
      url: imageUrl,
      public_id: public_id,
    },
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

  const messages = await Message.find({
    $or: [{ sender: currentUserId }, { receiver: currentUserId }],
  });

  const partnerIds = [
    ...new Set(
      messages.map((msg) =>
        msg.sender.toString() === currentUserId.toString()
          ? msg.receiver.toString()
          : msg.sender.toString(),
      ),
    ),
  ];

  const users = await User.find({
    _id: { $in: partnerIds },
  }).select(
    "-password -refreshToken -otp -verifyCode -otpExpiry -verifyCodeExpiry",
  );

  return res.status(200).json({
    success: true,
    message: "Chat partners fetched successfully.",
    data: users,
  });
});
