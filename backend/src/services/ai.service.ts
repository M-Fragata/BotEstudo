import z from "zod"
import { chamarLLM, extrairJSON } from "../utils/nvidiaLLM.ts"
import { AppError } from "../utils/errors.ts"

export interface GeneratedQuestion {
  prompt: string
  context?: string
  options: Array<{ id: string; text: string }>
  correctOptionId: string
}

export interface AiGenerationInput {
  title: string
  content?: string | null
  questionCount: number
}

const SYSTEM_PROMPT =
  "Você é um professor universitário experiente na elaboração de questões de múltipla escolha para simulados. " +
  "Crie questões claras, objetivas e com uma única alternativa correta, seguindo rigorosamente o formato JSON solicitado.";

const CHUNK_SIZE = 10;
const MAX_QUESTIONS = 30;

const optionSchema = z.object({
  id: z.enum(["a", "b", "c", "d"]),
  text: z.string().min(1, "Alternativa sem texto")
});

const questionSchema = z
  .object({
    prompt: z.string().min(5, "Enunciado muito curto"),
    context: z.string().min(1).optional(),
    options: z.array(optionSchema).length(4, "Cada questão deve ter exatamente 4 alternativas"),
    correctOptionId: z.enum(["a", "b", "c", "d"])
  })
  .refine((q) => q.options.some((o) => o.id === q.correctOptionId), {
    message: "correctOptionId deve pertencer às alternativas"
  });

const responseSchema = z.array(questionSchema).min(1).max(MAX_QUESTIONS);

function montarPrompt(input: AiGenerationInput, quantidade: number): string {
  const conteudo = (input.content ?? "").slice(0, 6000) || input.title;

  return `Crie ${quantidade} questões de múltipla escolha sobre o tema "${input.title}".

Material de apoio (use como base, mas não copie o texto literalmente):
${conteudo}

Responda EXCLUSIVAMENTE com um JSON válido, sem texto fora do JSON e sem aspas simples. O JSON deve ser uma lista com exatamente ${quantidade} objetos no formato:

[
  {
    "prompt": "enunciado da questão",
    "context": "texto de apoio opcional, ou omita o campo",
    "options": [
      { "id": "a", "text": "alternativa A" },
      { "id": "b", "text": "alternativa B" },
      { "id": "c", "text": "alternativa C" },
      { "id": "d", "text": "alternativa D" }
    ],
    "correctOptionId": "b"
  }
]

Regras:
- Exatamente ${quantidade} questões e 4 alternativas (a, b, c, d) por questão.
- Uma única alternativa correta por questão, indicada em "correctOptionId".
- Varie as alternativas corretas entre as questões.
- "context" é opcional; omita o campo quando não houver texto de apoio.
- As questões devem ser todas diferentes entre si e nenhuma deve repetir conteúdo já usado neste simulado.`;
}

async function gerarBloco(input: AiGenerationInput, quantidade: number): Promise<GeneratedQuestion[]> {
  const resposta = await chamarLLM(montarPrompt(input, quantidade), SYSTEM_PROMPT);

  let parsed: unknown;
  try {
    parsed = extrairJSON(resposta);
  } catch {
    throw new AppError(502, "Resposta da IA inválida. Tente novamente.");
  }

  const result = responseSchema.safeParse(parsed);
  if (!result.success) {
    throw new AppError(502, "A IA não retornou questões no formato esperado. Tente novamente.");
  }

  return result.data.map((question) => ({
    prompt: question.prompt,
    options: question.options,
    correctOptionId: question.correctOptionId,
    ...(question.context ? { context: question.context } : {})
  }));
}

export async function generateQuestions(input: AiGenerationInput): Promise<GeneratedQuestion[]> {
  const total = Math.min(Math.max(input.questionCount, 1), MAX_QUESTIONS);

  const blocos: number[] = [];
  let restante = total;
  while (restante > 0) {
    const tamanho = Math.min(CHUNK_SIZE, restante);
    blocos.push(tamanho);
    restante -= tamanho;
  }

  const questoes: GeneratedQuestion[] = [];
  for (const tamanho of blocos) {
    const bloco = await gerarBloco(input, tamanho);
    questoes.push(...bloco);
    if (questoes.length >= total) break;
  }

  return questoes;
}