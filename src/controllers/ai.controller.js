import { AICharacter } from "../models/aiCharacter.model.js";
import { AIMessage } from "../models/aiMessage.model.js";
import {asyncHandler} from "../utils/asyncHandler.js";
import { generateResponseStream } from "../ai/gemini.service.js";
import { io, userSocketMap } from "../socket/socket.js";

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
  const { aiCharacterId, message } = req.body;

  if (!aiCharacterId || !message?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Character ID and message are required.",
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
 console.log(history)

  await AIMessage.create({
    user: req.user._id,
    character: aiCharacterId,
    role: "user",
    content: message,
  });

  const stream = await generateResponseStream({
    systemPrompt: aiCharacter.systemPrompt,
    history,
    message,
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
