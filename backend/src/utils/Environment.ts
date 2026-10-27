import z from "zod"

import path from "node:path"
import dotenv from "dotenv"

dotenv.config()
dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") })
dotenv.config({ path: path.resolve(import.meta.dirname, "../../../.env") })
dotenv.config({ path: path.resolve(import.meta.dirname, "../../.env") })

const envSchema = z.object({
  DATABASE_URL: z.string().default("postgresql://postgres:postgres@localhost:5432/botestudo"),
  JWT_SECRET: z.string().default("default-jwt-secret-key-study"),
  PORT: z.coerce.number().default(3333),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  FACULDADE_USER: z.string().min(1, "FACULDADE_USER é obrigatório no .env"),
  FACULDADE_PASS: z.string().min(1, "FACULDADE_PASS é obrigatório no .env"),
  NVIDIA_API_KEY: z.string().optional()
})

const EnvRaw = envSchema.safeParse(process.env)

if (!EnvRaw.success) {
  throw new Error(`Invalid environment variables: ${JSON.stringify(EnvRaw.error.flatten().fieldErrors)}`)
}

export const Env = EnvRaw.data