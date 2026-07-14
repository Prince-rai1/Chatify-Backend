import { z } from "zod";

export const fullNameSchema = z
  .object({
    fullname: z
      .string()
      .trim()
      .min(3, "Full name must be at least 3 characters")
      .max(50, "Full name cannot exceed 50 characters")
  })