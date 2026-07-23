import mongoose from "mongoose";

const aiCharacterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: {
      type: String,
      required: true,
      trim: true,
    },

    greeting: {
      type: String,
      required: true,
      trim: true,
    },

    systemPrompt: {
      type: String,
      required: true,
    },

    expertise: {
      type: [String],
      default: [],
    },
    
    voice: {
      provider: {
        type: String,
        required: true,
      },

      name: {
        type: String,
        required: true,
      },

      language: {
        type: String,
        required: true,
      },
    },

    avatar: {
      url: {
        type: String,
        default: "",
      },

      public_id: {
        type: String,
        default: "",
      },
    },

    color: {
      type: String,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AICharacter = mongoose.model(
  "AICharacter",
  aiCharacterSchema
);