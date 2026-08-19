import type { NextFunction, Request, Response } from "express"
import { verifyToken } from "../utils/jwt.ts"

declare module "express-serve-static-core" {
  interface Request {
    user?: { id: string; email: string }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization

  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" })
    return
  }

  try {
    const payload = verifyToken(header.slice("Bearer ".length))
    req.user = { id: payload.sub, email: payload.email }
    next()
  } catch {
    res.status(401).json({ error: "Token inválido ou expirado" })
  }
}