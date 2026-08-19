import { PrismaClient } from "../generated/prisma/client.ts"
import { PrismaPg } from "@prisma/adapter-pg"
import { Env } from "./Environment.ts"

const adapter = new PrismaPg({ connectionString: Env.DATABASE_URL })

export const prisma = new PrismaClient({ adapter })