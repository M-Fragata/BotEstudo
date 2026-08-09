# Instruções para Geração de Resumos Compactos - BotEstudo

Este documento descreve o fluxo completo para gerar resumos compactos (ficha de prova) do conteúdo extraído pelo bot de estudo da Estácio, incluindo exercícios com respostas e justificativas.

## Estrutura de Pastas

```
resumos/
└── firstPeriod/
    ├── raw/
    │   ├── [disciplina].MD              ← conteúdo cru (bot salva aqui)
    │   ├── [disciplina]-exercicios.json ← exercícios extraídos (bot salva aqui)
    │   └── [disciplina]-respostas.json  ← respostas da IA (bot gera aqui)
    └── [disciplina].MD                  ← resumo formatado (Hermes gera aqui)
```

## Fluxo de Trabalho

### 1. Rodar o Bot

```bash
cd cd D:\Estudo\BotEstudo
npm run build && npm run start
```

O bot vai:
- Logar no portal Estácio via Microsoft SSO
- Extrair conteúdo dos temas da primeira disciplina pendente (se incompleto)
- Converter HTML para Markdown
- Aguardar timer de 15min por tema não concluído
- Extrair exercícios com verificação de tempo (batch ou tema por tema)
- **Salvar conteúdo cru em `resumos/firstPeriod/raw/[disciplina].MD`**
- **Salvar exercícios em `resumos/firstPeriod/raw/[disciplina]-exercicios.json`**
- **Chamar API NVIDIA diretamente para analisar exercícios**
- **Gerar respostas automaticamente**
- **Enviar respostas no site**

> ⚠️ **Importante**: Listas de exercícios são atualizadas a cada **30 minutos**. O bot verifica o tempo restante e escolhe a melhor estratégia:
> - **> 15min restantes**: Processa todos os temas de uma vez (batch)
> - **5-15min restantes**: Processa tema por tema
> - **< 5min restantes**: Aguarda próxima atualização

### 2. Processar Exercícios (Automático)

Após extrair os exercícios, o bot:
1. Chama a API NVIDIA (LLM) diretamente para analisar as questões
2. Gera automaticamente o arquivo `[disciplina]-respostas.json`
3. Envia as respostas no site
4. Remove o arquivo de respostas após envio

**Formato do JSON de respostas:**
```json
{
  "47261": {
    "1": "C",
    "2": "A",
    "3": "B"
  }
}
```

Onde:
- `"47261"` é o `listaId` (ID da lista de exercícios)
- `"1"` é o número da questão
- `"C"` é a letra da alternativa correta

### 3. Gerar Resumo (Hermes)

1. Identifique o nome da disciplina (ex: `introducao-a-programacao-de-computadores`)

2. **Base do resumo** (ordem de prioridade):
   - Verifique se existe o arquivo cru: `resumos/firstPeriod/raw/[disciplina].MD`
     - Se existir → leia como base do resumo
     - Se NÃO existir → vá para o próximo passo
   - Verifique se já existe um resumo: `resumos/firstPeriod/[disciplina].MD`
     - Se existir → leia como base (conteúdo já extraído em execução anterior)
     - Se NÃO existir → não há conteúdo para resumir, avise o usuário

3. **Leia o JSON de exercícios**: `resumos/firstPeriod/raw/[disciplina]-exercicios.json`
   - Se existir → inclua os exercícios no resumo com enunciado, alternativas e resposta correta
   - Se NÃO existir → gere resumo apenas com conteúdo

4. Gere o resumo em formato COMPACTO (Ficha de Prova):
   - Agrupar por CONCEITO (não por tema) — eliminar repetição
   - Bullet points com sintaxe inline (máx 8 por conceito)
   - Exercícios: enunciado em 1 linha + justificativa em 1 linha

5. Salve o resumo em `resumos/firstPeriod/[disciplina].MD`
   - Se criando do zero: write completo
   - Se atualizando (arquivo já existia): mantenha o conteúdo existente, adicione/atualize apenas a seção de exercícios

### 4. Verificação de Qualidade

Após gerar o resumo, **releia o arquivo** e verifique:

#### Itens de verificação

| Item | O que verificar |
|------|-----------------|
| **Typos** | Palavras incorretas, caracteres faltando |
| **Includes de código** | `#include <stdbool.h>` se usar `bool`, `#include <string.h>` se usar `strlen`, etc. |
| **Datas** | Ano correto (2026, não 2025) |
| **Sintaxe C** | Ponto e vírgula, chaves, parênteses |
| **Nomes de variáveis** | Consistentes com o conteúdo original |
| **Explicações** | Claras e didáticas |
| **Exercícios** | Completos e bem descritos |

#### Erros comuns a evitar

- `bool` sem `#include <stdbool.h>`
- `printf` com `%d` para `float` (deveria ser `%f`)
- `scanf` sem `&` antes da variável
- Strings sem terminador `\0`
- Acesso a array fora dos limites

#### Correção

Se encontrar erros:
1. Identifique o problema
2. Corrija no arquivo
3. Valide que a correção está correta
4. Salve o arquivo final

### 5. Formato do Resumo (Compacto - Ficha de Prova)

```markdown
# [Nome da Disciplina] - Resumo Rápido

## [Conceito 1 - ex: Tipos de Dados]
- `int` inteiro | `float` decimal simples | `double` decimal duplo | `char` caractere
- Strings: `char nome[20] = "texto"` (terminado em `\0`)
- Declaração: `tipo nome;` | Inicialização: `tipo nome = valor;`

## [Conceito 2 - ex: Entrada e Saída]
- `printf("texto %d", var)` → `%d`=int `%f`=float `%c`=char `%s`=string `%.2f`=2 casas
- `scanf("%d", &var)` ← sempre com `&`

## [Conceito 3 - ex: Operadores]
- Matemáticos: `+` `-` `*` `/` `%`
- Relacionais: `==` `!=` `>` `<` `>=` `<=`
- Lógicos: `&&` E | `||` OU | `!` NÃO

## [Conceito N - ex: Controle de Fluxo, Repetição, Vetores, etc.]

## Exercícios - Respostas Rápidas
Q1: [enunciado resumido em 1 linha] → **[Letra] ([Resposta])**
> Justificativa: [explicação curta em 1 linha]

Q2: [enunciado resumido em 1 linha] → **[Letra] ([Resposta])**
> Justificativa: [explicação curta em 1 linha]
```

**Regras obrigatórias:**
- Máximo 80 linhas por disciplina
- Máximo 8 bullet points por conceito
- Agrupar por CONCEITO (não por tema) — eliminar repetição
- Exercícios: enunciado em 1 linha + justificativa em 1 linha
- Sem blocos de código longos (usar sintaxe inline com crases `` ` ``)
- Sem tabelas de alternativas (apenas resposta + justificativa)

## Formato do JSON de Exercícios

```json
[
  {
    "titulo": "Super Trunfo em c: Fundamentos e Téc...",
    "tema": "Tema 2",
    "listaId": "47261",
    "status": "Pendente",
    "questoes": [
      {
        "numero": 1,
        "enunciado": "Analise a tabela a seguir...",
        "alternativas": [
          {
            "letra": "A",
            "texto": "Disjunção",
            "hash": "65b132e455fefcc52fd55da1"
          },
          {
            "letra": "B",
            "texto": "Conjunção",
            "hash": "65b132e455fefcc52fd55da2"
          }
        ]
      }
    ]
  }
]
```

## Formato do JSON de Respostas

```json
{
  "47261": {
    "1": "C",
    "2": "A",
    "3": "B",
    "4": "E",
    "5": "A"
  }
}
```

## Comando Rápido

### Extrair conteúdo e exercícios
```bash
npm run build && npm run start
```
