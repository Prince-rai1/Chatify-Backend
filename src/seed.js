import "dotenv/config";
import connectDB from "./db/db_connect.js";
import { seedAICharacters } from "./ai/ai.seed.js";

const run = async () => {
  try {
    await connectDB();

    await seedAICharacters();

    console.log("✅ AI Characters Seeded");

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

run();