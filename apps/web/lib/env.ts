import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  NEXT_PUBLIC_WS_URL: z
    .string()
    .url()
    .optional(),

  NEXT_PUBLIC_API_URL: z
    .string()
    .url()
    .optional()
});

const parsedEnvironment = environmentSchema.safeParse({
  NEXT_PUBLIC_APP_ENV:
    process.env["NEXT_PUBLIC_APP_ENV"],

  NEXT_PUBLIC_WS_URL:
    process.env["NEXT_PUBLIC_WS_URL"],

  NEXT_PUBLIC_API_URL:
    process.env["NEXT_PUBLIC_API_URL"]
});

if (!parsedEnvironment.success) {
  console.error(
    "Invalid Couple Space environment configuration:",
    parsedEnvironment.error.flatten().fieldErrors
  );

  throw new Error(
    "Invalid environment configuration."
  );
}

export const env = parsedEnvironment.data;