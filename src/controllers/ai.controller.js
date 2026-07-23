import { AICharacter } from "../models/aiCharacter.model.js";
import { AIMessage } from "../models/aiMessage.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { generateResponseStream } from "../ai/gemini.service.js";
import { io, userSocketMap } from "../socket/socket.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
export const getAICharacters = asyncHandler(async (req, res) => {
  const characters = await AICharacter.find({
    isActive: true,
  }).select("-systemPrompt");

  return res.status(200).json({
    success: true,
    message: "AI characters fetched successfully.",
    data: characters,
  });
});

export const getAIChatHistory = asyncHandler(async (req, res) => {
  const { characterId } = req.params;

  const character = await AICharacter.findById(characterId);

  if (!character) {
    return res.status(404).json({
      success: false,
      message: "AI character not found.",
    });
  }

  const messages = await AIMessage.find({
    user: req.user._id,
    character: characterId,
  }).sort({ createdAt: 1 });

  return res.status(200).json({
    success: true,
    message: "AI chat history fetched successfully.",
    data: messages,
  });
});





const HISTORY_LIMIT = 40;

export const chatWithAI = asyncHandler(async (req, res) => {
  const { aiCharacterId, message, fileData, fileName, fileType } = req.body;

  if (!aiCharacterId || (!message?.trim() && !fileData)) {
    return res.status(400).json({
      success: false,
      message: "Character ID and message/file are required.",
    });
  }

  const aiCharacter = await AICharacter.findById(aiCharacterId);

  if (!aiCharacter) {
    return res.status(404).json({
      success: false,
      message: "AI character not found.",
    });
  }

 const rawHistory = await AIMessage.find({
    user: req.user._id,
    character: aiCharacterId,
  })
    .sort({ createdAt: -1 })
    .limit(HISTORY_LIMIT)
    .lean();

  // Fir unko seedha (reverse) kar do taaki chat flow sahi rahe
  const history = rawHistory.reverse();
  
  let userMessageContent = message || "";
  let finalFileUrl = null;

  if (fileData) {
    if (fileType && (fileType.startsWith("image/") || fileType === "application/pdf")) {
      // It's a media file (Base64)
      const base64Data = fileData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      const uploadResult = await uploadOnCloudinary(buffer);
      if (uploadResult) {
        finalFileUrl = uploadResult.secure_url;
      }
    } else {
      // It's a text/code file. Append to message text for Gemini and DB
      userMessageContent += `\n\n--- Attached File: ${fileName} ---\n${fileData}`;
    }
  }

  await AIMessage.create({
    user: req.user._id,
    character: aiCharacterId,
    role: "user",
    content: userMessageContent,
    fileUrl: finalFileUrl,
    fileName: fileName || null,
    fileType: fileType || null,
  });

  const stream = await generateResponseStream({
    systemPrompt: aiCharacter.systemPrompt,
    history,
    message: userMessageContent,
    fileData: (fileType && (fileType.startsWith("image/") || fileType === "application/pdf")) ? fileData : null,
    fileType,
  });

  let fullResponse = "";
  const socketId = userSocketMap.get(req.user._id.toString());

  for await (const chunk of stream) {
    const text = chunk.text;

    if (!text) continue;

    fullResponse += text;

    if (socketId) {
      io.to(socketId).emit("ai:chunk", {
        chunk: text,
      });
    }
  }

  if (socketId) {
    io.to(socketId).emit("ai:end");
  }

  await AIMessage.create({
    user: req.user._id,
    character: aiCharacterId,
    role: "model",
    content: fullResponse,
  });

  res.status(200).json({
    success: true,
    message: "AI response sent",
  });
});



export const clearAIChatHistory = asyncHandler(async (req, res) => {

  const { characterId } = req.params;

  const character = await AICharacter.findById(characterId);

  if (!character) {
    return res.status(404).json({
      success: false,
      message: "AI character not found.",
    });
  }

  await AIMessage.deleteMany({
    user: req.user._id,
    character: characterId,
  });

  return res.status(200).json({
    success: true,
    message: "AI chat history cleared successfully.",
  });

});
