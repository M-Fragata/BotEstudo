import type { NextFunction, Request, Response } from "express"
import { AppError } from "../utils/errors.ts"

interface SinaisErro {
  status?: number
  type?: string
  code?: string
}

function tipoBodyParser(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null
  const sinal = err as SinaisErro
  if (typeof sinal.type !== "string" || typeof sinal.status !== "number") return null
  return sinal.type
}

function codigoPrisma(err: unknown): string | null {
  if (typeof err !== "object" || err === null) return null
  const code = (err as SinaisErro).code
  if (typeof code !== "string" || !/^P\d{4}$/.test(code)) return null
  return code
}

function logErro(req: Request, err: unknown, tipo = "Erro") {
  const origem = `${tipo} ${req.method} ${req.originalUrl}`
  if (err instanceof Error) {
    console.error(`[${origem}] ${err.message}`)
    if (err.stack) console.error(err.stack)
  } else {
    console.error(`[${origem}]`, err)
  }
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logErro(req, err)
    res.status(err.statusCode).json({ error: err.message })
    return
  }

  const tipoBody = tipoBodyParser(err)

  if (tipoBody === "entity.parse.failed") {
    console.warn(`[JSON inválido] ${req.method} ${req.originalUrl}`)
    res.status(400).json({ error: "Corpo da requisição em formato JSON inválido" })
    return
  }

  if (tipoBody === "entity.too.large") {
    console.warn(`[Payload excedido] ${req.method} ${req.originalUrl}`)
    res.status(413).json({ error: "O conteúdo enviado é muito grande (limite de 10 MB)" })
    return
  }

  const codigo = codigoPrisma(err)

  if (codigo === "P2002") {
    console.warn(`[Conflito] ${req.method} ${req.originalUrl}: registro duplicado`)
    res.status(409).json({ error: "Registro já existente" })
    return
  }

  if (codigo === "P2025") {
    console.warn(`[Não encontrado] ${req.method} ${req.originalUrl}`)
    res.status(404).json({ error: "Registro não encontrado" })
    return
  }

  if (codigo) {
    logErro(req, err, "Falha no banco")
    res.status(500).json({ error: "Falha ao acessar o banco de dados" })
    return
  }

  logErro(req, err)
  res.status(500).json({ error: "Erro interno do servidor" })
}