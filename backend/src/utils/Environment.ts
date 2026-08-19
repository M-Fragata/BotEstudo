import z from "zod"

import "dotenv/config"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  FACULDADE_USER: z.string(),
  FACULDADE_PASS: z.string(),
  NVIDIA_API_KEY: z.string()
})

const EnvRaw = envSchema.safeParse(process.env)

if (!EnvRaw.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(EnvRaw.error.flatten().fieldErrors)}`)
}

export const Env = EnvRaw.data