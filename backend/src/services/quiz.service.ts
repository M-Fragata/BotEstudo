import { prisma } from "../utils/prisma.ts"
import { Prisma } from "../generated/prisma/client.ts"
import { AppError } from "../utils/errors.ts"
import { generateQuestions } from "./ai.service.ts"
import type { AnswerInput, AnswersInput, GenerateQuizInput } from "../schemas/quiz.schema.ts"

export interface QuizListItem {
  id: string
  title: string
  status: string
  score: number | null
  createdAt: Date
}

export async function listQuizzes(userId: string): Promise<QuizListItem[]> {
  return prisma.quiz.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, status: true, score: true, createdAt: true }
  })
}

export async function generateQuiz(userId: string, input: GenerateQuizInput) {
  const discipline = await prisma.discipline.findFirst({
    where: { id: input.disciplineId, userId }
  })

  if (!discipline) {
    throw new AppError(404, "Disciplina não encontrada")
  }

  const material = input.materialId
    ? await prisma.studyMaterial.findFirst({ where: { id: input.materialId, userId } })
    : null

  if (input.materialId && !material) {
    throw new AppError(404, "Material não encontrado")
  }

  const generated = await generateQuestions({
    title: discipline.name,
    content: material?.content ?? null,
    questionCount: input.questionCount
  })

  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.create({
      data: {
        userId,
        disciplineId: discipline.id,
        materialId: material?.id ?? null,
        title: discipline.name
      }
    })

    await tx.question.createMany({
      data: generated.map((q, index) => ({
        quizId: quiz.id,
        position: index + 1,
        prompt: q.prompt,
        context: q.context ?? null,
        options: q.options,
        correctOptionId: q.correctOptionId
      }))
    })

    const questions = await tx.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { position: "asc" },
      select: {
        id: true,
        position: true,
        prompt: true,
        context: true,
        options: true
      }
    })

    return { id: quiz.id, title: quiz.title, questions }
  })
}

export async function startDisciplineQuiz(userId: string, disciplineId: string, limite = 10) {
  const discipline = await prisma.discipline.findFirst({
    where: { id: disciplineId, userId },
    select: { id: true, name: true }
  })

  if (!discipline) {
    throw new AppError(404, "Disciplina não encontrada")
  }

  const candidatas = await prisma.question.findMany({
    where: { quiz: { disciplineId, userId } },
    select: { id: true, prompt: true }
  })

  if (candidatas.length === 0) {
    throw new AppError(404, "Esta disciplina ainda não tem questões. Gere um simulado antes de iniciar.")
  }

  const porPrompt = new Map<string, string>()
  for (const q of candidatas) {
    const chave = q.prompt.trim().replace(/\s+/g, " ")
    if (!porPrompt.has(chave)) porPrompt.set(chave, q.id)
  }

  const ids = embaralhar([...porPrompt.values()]).slice(0, limite)

  const questoes = await prisma.question.findMany({
    where: { id: { in: ids } },
    select: { prompt: true, context: true, options: true, correctOptionId: true }
  })

  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.create({
      data: { userId, disciplineId, title: discipline.name }
    })

    await tx.question.createMany({
      data: questoes.map((q, index) => ({
        quizId: quiz.id,
        position: index + 1,
        prompt: q.prompt,
        context: q.context ?? null,
        options: q.options as Prisma.InputJsonValue,
        correctOptionId: q.correctOptionId
      }))
    })

    const questions = await tx.question.findMany({
      where: { quizId: quiz.id },
      orderBy: { position: "asc" },
      select: {
        id: true,
        position: true,
        prompt: true,
        context: true,
        options: true
      }
    })

    const session = await tx.quizSession.create({
      data: { userId, quizId: quiz.id, currentIndex: 0 }
    })

    return { id: quiz.id, title: quiz.title, questions, sessionId: session.id }
  })
}

function embaralhar<T>(itens: T[]): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const a: T | undefined = copia[i]
    const b: T | undefined = copia[j]
    if (a !== undefined && b !== undefined) {
      copia[i] = b
      copia[j] = a
    }
  }
  return copia
}

export async function createSession(userId: string, quizId: string) {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, userId },
    include: {
      questions: { orderBy: { position: "asc" }, select: { id: true, position: true } },
      sessions: { select: { finishedAt: true } }
    }
  })

  if (!quiz) {
    throw new AppError(404, "Simulado não encontrado")
  }

  if (quiz.status === "COMPLETED" && quiz.sessions.some((s) => s.finishedAt)) {
    throw new AppError(409, "Este simulado já foi finalizado")
  }

  const session = await prisma.quizSession.create({
    data: { userId, quizId, currentIndex: 0 }
  })

  return {
    sessionId: session.id,
    currentIndex: 0,
    totalQuestions: quiz.questions.length
  }
}

export async function answerQuestion(userId: string, sessionId: string, input: AnswerInput) {
  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: { quiz: { include: { questions: true } } }
  })

  if (!session) {
    throw new AppError(404, "Sessão não encontrada")
  }

  if (session.finishedAt) {
    throw new AppError(409, "Sessão já finalizada")
  }

  const question = session.quiz.questions.find((q) => q.id === input.questionId)
  if (!question) {
    throw new AppError(404, "Questão não encontrada")
  }

  const isCorrect = question.correctOptionId === input.selectedOptionId

  const answer = await prisma.userAnswer.upsert({
    where: { sessionId_questionId: { sessionId, questionId: question.id } },
    create: {
      sessionId,
      questionId: question.id,
      selectedOptionId: input.selectedOptionId,
      isCorrect
    },
    update: {
      selectedOptionId: input.selectedOptionId,
      isCorrect
    }
  })

  await prisma.question.update({
    where: { id: question.id },
    data: { lastAnswerCorrect: isCorrect }
  })

  return { questionId: question.id, isCorrect: answer.isCorrect }
}

export async function answerBatch(userId: string, sessionId: string, input: AnswersInput) {
  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: { quiz: { include: { questions: { select: { id: true, correctOptionId: true } } } } }
  })

  if (!session) {
    throw new AppError(404, "Sessão não encontrada")
  }

  if (session.finishedAt) {
    throw new AppError(409, "Sessão já finalizada")
  }

  const porQuestao = new Map<string, string>()
  for (const a of input.answers) {
    if (session.quiz.questions.some((q) => q.id === a.questionId)) {
      porQuestao.set(a.questionId, a.selectedOptionId)
    }
  }

  if (porQuestao.size === 0) {
    return { answered: 0 }
  }

  await prisma.$transaction(async (tx) => {
    for (const [questionId, selectedOptionId] of porQuestao) {
      const question = session.quiz.questions.find((q) => q.id === questionId)
      if (!question) continue

      const isCorrect = question.correctOptionId === selectedOptionId

      await tx.userAnswer.upsert({
        where: { sessionId_questionId: { sessionId, questionId } },
        create: {
          sessionId,
          questionId,
          selectedOptionId,
          isCorrect
        },
        update: {
          selectedOptionId,
          isCorrect
        }
      })

      await tx.question.update({
        where: { id: questionId },
        data: { lastAnswerCorrect: isCorrect }
      })
    }
  })

  return { answered: porQuestao.size }
}

export async function finishSession(userId: string, sessionId: string) {
  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      quiz: { include: { questions: true } },
      answers: true
    }
  })

  if (!session) {
    throw new AppError(404, "Sessão não encontrada")
  }

  if (session.finishedAt) {
    throw new AppError(409, "Sessão já finalizada")
  }

  const total = session.quiz.questions.length
  const correctCount = session.answers.filter((a) => a.isCorrect).length
  const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

  const result = await prisma.$transaction(async (tx) => {
    const finished = await tx.quizSession.update({
      where: { id: session.id },
      data: { finishedAt: new Date(), currentIndex: total }
    })

    await tx.quiz.update({
      where: { id: session.quiz.id },
      data: { status: "COMPLETED", score, correctCount },
      select: { id: true }
    })

    await upsertWeeklyStats(tx, userId)
    await updateDisciplineRetention(tx, session.quiz.disciplineId, userId)

    return finished
  })

  void result

  return buildResult(session.quiz.questions, session.answers, correctCount, total, score)
}

export async function getSessionResult(userId: string, sessionId: string) {
  const session = await prisma.quizSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      quiz: { include: { questions: true } },
      answers: true
    }
  })

  if (!session) {
    throw new AppError(404, "Sessão não encontrada")
  }

  const total = session.quiz.questions.length
  const correctCount = session.answers.filter((a) => a.isCorrect).length
  const score = session.quiz.score ?? (total > 0 ? Math.round((correctCount / total) * 100) : 0)

  return buildResult(session.quiz.questions, session.answers, correctCount, total, score)
}

function buildResult(
  questions: Array<{ id: string; prompt: string; correctOptionId: string; options: unknown }>,
  answers: Array<{ questionId: string; selectedOptionId: string; isCorrect: boolean }>,
  correctCount: number,
  total: number,
  score: number
) {
  const optionsById = new Map<string, Array<{ id: string; text: string }>>()

  const items = questions.map((question) => {
    const answer = answers.find((a) => a.questionId === question.id)
    let options = optionsById.get(question.id)
    if (!options) {
      options = (question.options as Array<{ id: string; text: string }> | null) ?? []
      optionsById.set(question.id, options)
    }

    const correct = answer ? answer.isCorrect : false
    const userOption = options.find((o) => o.id === answer?.selectedOptionId)
    const correctOption = options.find((o) => o.id === question.correctOptionId)

    return {
      questionNumber: questions.indexOf(question) + 1,
      prompt: question.prompt,
      userAnswer: userOption?.text ?? "Não respondida",
      correctAnswer: correct ? undefined : correctOption?.text,
      correct
    }
  })

  return {
    score,
    correctCount,
    total,
    items,
    feedback: score >= 70 ? "Desempenho acima da média!" : "Continue praticando para melhorar!"
  }
}

async function upsertWeeklyStats(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  userId: string
) {
  const weekStart = startOfWeek()

  const existing = await tx.userStat.findUnique({
    where: { userId_weekStart: { userId, weekStart } }
  })

  const answered = await tx.userAnswer.count({
    where: { session: { userId } }
  })
  const correct = await tx.userAnswer.count({
    where: { session: { userId }, isCorrect: true }
  })

  if (existing) {
    await tx.userStat.update({
      where: { id: existing.id },
      data: { questionsDone: answered, questionsRight: correct }
    })
  } else {
    await tx.userStat.create({
      data: {
        userId,
        weekStart,
        questionsDone: answered,
        questionsRight: correct,
        studyMinutes: 0
      }
    })
  }
}

async function updateDisciplineRetention(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  disciplineId: string,
  userId: string
) {
  const answers = await tx.userAnswer.findMany({
    where: {
      session: { userId },
      question: { quiz: { disciplineId } }
    },
    select: { isCorrect: true }
  })

  if (answers.length === 0) return

  const retention = Math.round((answers.filter((a) => a.isCorrect).length / answers.length) * 100)

  await tx.discipline.update({
    where: { id: disciplineId },
    data: { retention }
  })
}

function startOfWeek(): Date {
  const now = new Date()
  const day = (now.getDay() + 6) % 7
  const start = new Date(now)
  start.setDate(now.getDate() - day)
  start.setHours(0, 0, 0, 0)
  return start
}