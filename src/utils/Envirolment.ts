import z from "zod"

import 'dotenv/config';

const envSchema = z.object({
    FACULDADE_USER: z.string(),
    FACULDADE_PASS: z.string()
})

const EnvRaw = envSchema.safeParse(process.env)

if (!EnvRaw.success) {
    throw new Error("Invalid environment variables")
}

export const Env = EnvRaw.data
