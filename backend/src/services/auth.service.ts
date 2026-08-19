import { prisma } from "../utils/prisma.ts"
import { hashPassword, comparePassword } from "../utils/hash.ts"
import { signToken } from "../utils/jwt.ts"
import { AppError } from "../utils/errors.ts"
import type { LoginInput, RegisterInput } from "../schemas/auth.schema.ts"

export interface AuthUser {
  id: string
  email: string
  name: string | null
}

export async function register(input: RegisterInput): Promise<{ user: AuthUser; token: string }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })

  if (existing) {
    throw new AppError(409, "E-mail já cadastrado")
  }

  const passwordHash = await hashPassword(input.password)

  const user = await prisma.user.create({
    data: {
      email: input.email,
      name: input.name ?? null,
      passwordHash,
      authMethod: "EMAIL"
    }
  })

  const token = signToken({ sub: user.id, email: user.email })
  return { user: { id: user.id, email: user.email, name: user.name }, token }
}

export async function login(input: LoginInput): Promise<{ user: AuthUser; token: string }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } })

  if (!user?.passwordHash) {
    throw new AppError(401, "Credenciais inválidas")
  }

  const valid = await comparePassword(input.password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, "Credenciais inválidas")
  }

  const token = signToken({ sub: user.id, email: user.email })
  return { user: { id: user.id, email: user.email, name: user.name }, token }
}