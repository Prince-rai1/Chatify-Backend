import { z } from "zod";

export const signInSchema = z.object({
  identifier: z.string().trim().min(3, "Email or username is required"),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .max(30, "Password cannot exceed 30 characters"),
});
