import jwt from "jsonwebtoken"
import { Env } from "./Environment.ts"

const EXPIRES_IN = "7d"

export interface TokenPayload {
  sub: string
  email: string
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, Env.JWT_SECRET, { expiresIn: EXPIRES_IN })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, Env.JWT_SECRET) as TokenPayload
}