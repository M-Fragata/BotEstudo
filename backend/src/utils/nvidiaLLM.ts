const MODELOS = [
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'openai/gpt-oss-20b',
  'deepseek-ai/deepseek-v4-flash-0731',
  'z-ai/glm-5.2',
  'nvidia/nemotron-3-nano-30b-a3b',
];
const MODELOS_COM_SCHEMA = new Set([
  'nvidia/llama-3.3-nemotron-super-49b-v1',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'openai/gpt-oss-20b',
  'deepseek-ai/deepseek-v4-flash-0731',
  'z-ai/glm-5.2',
  'nvidia/nemotron-3-nano-30b-a3b',
]);
const BACKOFF_MS = [5000, 10000, 15000, 20000, 30000];
const LLM_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const PROMPT_PADRAO_SYSTEM =
  'Você é um professor universitário especializado em programação. Analise cada questão e determine a resposta correta. Pode raciocinar, mas TERMINE sua resposta com o JSON de respostas.';

export async function chamarLLM(
  prompt: string,
  systemPrompt: string = PROMPT_PADRAO_SYSTEM,
  responseSchema?: Record<string, unknown>
): Promise<string> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY não configurada no .env');
  }
  const maxTentativas = MODELOS.length;
  for (let tentativa = 0; tentativa < maxTentativas; tentativa++) {
    const modelo = MODELOS[tentativa];
    const schemaBody = responseSchema && MODELOS_COM_SCHEMA.has(modelo ?? "") ? responseSchema : undefined;
    try {
      console.log(`  🤖 Tentativa ${tentativa + 1}/${maxTentativas}: Modelo ${modelo}`);
      const response = await fetch(LLM_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: modelo,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 8192,
          ...(schemaBody
            ? {
                response_format: {
                  type: 'json_schema',
                  json_schema: {
                    name: 'resposta',
                    strict: false,
                    schema: schemaBody
                  }
                }
              }
            : {})
        })
      });
      if (response.status === 503 || response.status === 500) {
        const error = await response.text();
        console.log(`  ⚠️ Modelo ${modelo} retornou ${response.status}: ${error.substring(0, 100)}`);
        if (tentativa < maxTentativas - 1) {
          const espera = BACKOFF_MS[tentativa] ?? 30000;
          console.log(`  ⏳ Aguardando ${espera / 1000}s antes de tentar próximo modelo...`);
          await new Promise(resolve => setTimeout(resolve, espera));
        }
        continue;
      }
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Erro na API NVIDIA (${modelo}): ${response.status} - ${error}`);
      }
      const data = await response.json();
      const conteudo = data.choices?.[0]?.message?.content || '';
      if (conteudo) {
        console.log(`  ✅ Modelo ${modelo} respondeu com sucesso`);
        return conteudo;
      }
      console.log(`  ⚠️ Modelo ${modelo} retornou resposta vazia`);
    }
    catch (err) {
      if (tentativa < maxTentativas - 1) {
        console.log(`  ⚠️ Erro com modelo ${modelo}: ${err instanceof Error ? err.message : err}`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Falha após ${maxTentativas} tentativas com todos os modelos: ${MODELOS.join(', ')}`);
}

export function extrairJSON(resposta: string): unknown {
  const limpa = resposta.replace(/```json\s*/gi, '').replace(/```/gi, '').trim();
  const tentativas = [
    limpa.match(/\[[\s\S]*\]/),
    limpa.match(/\{[\s\S]*\}/)
  ];
  for (const match of tentativas) {
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // tenta próxima forma abaixo
      }
    }
  }
  return JSON.parse(limpa);
}