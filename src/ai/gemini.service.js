import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const formatHistory = (history = []) => {
  return history.map((message) => ({
    role: message.role,
    parts: [
      {
        text: message.content,
      },
    ],
  }));
};

export const generateResponseStream = async ({
  systemPrompt,
  history = [],
  message,
}) => {
  const contents = [
    ...formatHistory(history),

    {
      role: "user",
      parts: [
        {
          text: message,
        },
      ],
    },
  ];

  const stream = await ai.models.generateContentStream({
    model: MODEL,

    config: {
      systemInstruction: systemPrompt,
    },

    contents,
  });

  return stream;
};