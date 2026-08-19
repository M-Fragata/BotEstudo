import type { NextFunction, Request, Response } from "express"
import type { ZodSchema } from "zod"

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      res.status(400).json({ error: "Dados inválidos", details: result.error.flatten() })
      return
    }
    req.body = result.data
    next()
  }
}

export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params)
    if (!result.success) {
      res.status(400).json({ error: "Parâmetros inválidos", details: result.error.flatten() })
      return
    }
    req.params = result.data as unknown as Request["params"]
    next()
  }
}