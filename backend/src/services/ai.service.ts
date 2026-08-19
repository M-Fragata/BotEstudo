import z from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"
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

const responseJsonSchema = zodToJsonSchema(responseSchema as never, {
  name: "resposta",
  target: "openAi"
});

function montarPrompt(input: AiGenerationInput, quantidade: number): string {
  const conteudo = (input.content ?? "").slice(0, 15000) || input.title;

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

function normalizarQuestao(questao: unknown): unknown {
  if (typeof questao !== "object" || questao === null || Array.isArray(questao)) return questao;
  const q = questao as Record<string, unknown>;

  const options = Array.isArray(q.options)
    ? q.options.map((op) => {
        if (typeof op !== "object" || op === null) return op;
        const o = op as Record<string, unknown>;
        return {
          ...o,
          id: typeof o.id === "string" ? o.id.toLowerCase().trim() : o.id,
          text: typeof o.text === "string" ? o.text.trim() : o.text
        };
      })
    : q.options;

  return {
    ...q,
    prompt: typeof q.prompt === "string" ? q.prompt.trim() : q.prompt,
    context: typeof q.context === "string" && q.context.trim() ? q.context.trim() : undefined,
    correctOptionId:
      typeof q.correctOptionId === "string" ? q.correctOptionId.toLowerCase().trim() : q.correctOptionId,
    options
  };
}

function normalizarResposta(bruta: unknown): unknown {
  if (!Array.isArray(bruta)) return bruta;
  return bruta.map(normalizarQuestao);
}

async function tentarGerarBloco(
  input: AiGenerationInput,
  quantidade: number,
  comSchema: boolean
): Promise<GeneratedQuestion[] | null> {
  const resposta = await chamarLLM(
    montarPrompt(input, quantidade),
    SYSTEM_PROMPT,
    comSchema ? responseJsonSchema : undefined
  );

  let parsed: unknown;
  try {
    parsed = extrairJSON(resposta);
  } catch {
    return null;
  }

  const result = responseSchema.safeParse(normalizarResposta(parsed));
  if (!result.success) {
    console.error(`[IA] Resposta fora do formato esperado (${quantidade} questões):`, result.error.issues.slice(0, 5));
    return null;
  }

  return result.data.map((question) => ({
    prompt: question.prompt,
    options: question.options,
    correctOptionId: question.correctOptionId,
    ...(question.context ? { context: question.context } : {})
  }));
}

async function gerarBloco(input: AiGenerationInput, quantidade: number): Promise<GeneratedQuestion[]> {
  try {
    const comSchema = await tentarGerarBloco(input, quantidade, true);
    if (comSchema) return comSchema;

    console.warn(`[IA] Fallback: tentando ${quantidade} questões sem schema guiado...`);
    const semSchema = await tentarGerarBloco(input, quantidade, false);
    if (semSchema) return semSchema;
  } catch (err) {
    console.error(`[IA] Falha ao gerar bloco de ${quantidade} questões:`, err);
    throw new AppError(502, "Não foi possível gerar as questões com a IA. Tente novamente.");
  }

  throw new AppError(502, "A IA não retornou questões no formato esperado. Tente novamente.");
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