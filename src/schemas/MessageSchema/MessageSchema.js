import { z } from "zod";

export const messageSchema = z.object({
  message: z
  .string()
  .trim()
  .max(1000)
  .optional(),
});
