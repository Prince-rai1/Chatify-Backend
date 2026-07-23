import mongoose from "mongoose";

const aiMessageSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    character: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AICharacter",
      required: true,
      index: true,
    },

    role: {
      type: String,
      enum: ["user", "model"],
      required: true,
    },

    content: {
      type: String,
      required: true,
      trim: true,
    },
    
    fileUrl: {
      type: String,
      default: null,
    },

    fileName: {
      type: String,
      default: null,
    },

    fileType: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

aiMessageSchema.index({
  user: 1,
  character: 1,
  createdAt: 1,
});

export const AIMessage = mongoose.model(
  "AIMessage",
  aiMessageSchema
);