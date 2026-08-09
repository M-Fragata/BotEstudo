# Introdução à Programação de Computadores - Ficha de Prova

## Tipos de Dados e Variáveis
- `int` inteiro | `float` decimal simples | `double` decimal duplo | `char` caractere | `void` vazio
- Strings: `char nome[20] = "texto"` (terminado em `\0`)
- Declaração: `tipo nome;` | Inicialização: `tipo nome = valor;`
- Modificadores: `short` `long` `long long` `signed` `unsigned`
- Constantes: `#define` (pré-processador) | `const` (tipo verificado)

## Entrada e Saída
- `printf("texto %d", var)` → `%d`/`%i`=int | `%f`=float | `%.2f`=2 casas | `%c`=char | `%s`=string
- `scanf("%d", &var)` ← **sempre com `&`** (endereço)
- Buffer: `getchar()` limpa `\n` residual após `scanf`

## Operadores
- Matemáticos: `+` `-` `*` `/` `%` (módulo)
- Relacionais: `==` `!=` `>` `<` `>=` `<=` → resultam 0 ou 1
- Lógicos: `&&` (E) | `||` (OU) | `!` (NÃO)
- Precedência: `()` > `* / %` > `+ -` > relacionais > `&&` > `||` > `?:` > `=`
- Incremento: `++x` (pré) | `x++` (pós) | `--x` | `x--`
- Ternário: `cond ? val_se_v : val_se_f`

## Controle de Fluxo
- `if (cond) { } else if { } else { }`
- `switch (var) { case val: ... break; default: ... }` → `break` sai do switch
- `for (ini; cond; inc) { }` — repetição conhecida
- `while (cond) { }` — testa antes (pode não executar)
- `do { } while (cond);` — executa pelo menos 1x
- `break` sai do loop/ switch | `continue` pula iteração

## Estruturas Compostas
- `struct` agrupa campos: `typedef struct { tipo campo; } Nome;`
- Acesso: `var.campo` | `ptr->campo`
- Arrays: `tipo nome[tam];` | índice 0 a tam-1 | `for (i=0; i<tam; i++)`
- Strings (`<string.h>`): `strlen` `strcpy` `strcat` `strcmp` (0=iguais)

## Cálculos Derivados (Super Trunfo)
- Densidade: `populacao / area`
- PIB per capita: `pib / populacao`
- `unsigned long long` para população | `long double` para PIB grande

## Exercícios - Respostas Rápidas
Q1: Tabela verdade p=1 q=1 → operação? → **A (Disjunção/OR)**  
> OR resulta 1 se pelo menos um operando for 1.

Q2: Operador para "pelo menos uma condição verdadeira"? → **C (OR / ||)**  
> `||` retorna verdadeiro se qualquer operando for verdadeiro.

Q3: Operador conjunção "E" (todas verdadeiras)? → **B (&&)**  
> `&&` só resulta 1 se ambos operandos forem 1.

Q4: Tipo para "números de ponto flutuante" em C? → **E (float)**  
> `float` = precisão simples; `double` = precisão dupla.

Q5: `scanf("%c %d", letra.num)` sem `&` + input `r` `2` → saída? → **A (imprime r e 2)**  
> Código tem bug (falta `&` e usa `.` em vez de `,`), mas questão pede "possibilidade" — com correção implícita imprime valores lidos.

Q6: `int num; scanf("%f", &num);` → problema? → **B (scanf deve usar %d)**  
> `%f` lê float, mas `num` é int → corrompe memória; correto: `scanf("%d", &num)`.

Q7: `scanf("%c %d", &letra, &num)` + input `j` `5` → saída? → **A (imprime j e 5)**  
> Código correto com `&`; lê char e int e imprime com `%c` e `%d`.

Q8: Operador para incrementar variável em 1? → **E (Operador de incremento / ++)**  
> `++x` ou `x++` incrementa em 1; mais eficiente e legível que `x = x + 1`.

Q9: `int a=3, b=2, c; c=a!=b;` → valores finais? → **A (3, 2, 1)**  
> `!=` retorna 1 (verdadeiro) pois 3 ≠ 2; `a` e `b` não mudam.

Q10: Portugol: lados 10, 11, 11 → qual caso? → **C (Caso 2)**  
> `lado_a != lado_b` (10≠11) mas `lado_b == lado_c` (11=11) → entra no `ou` do `senao` → Caso 2.

Q11: `switch` + `break` — afirmação correta? → **D (break encerra switch, fluxo vai para próximo comando)**  
> `break` sai do `switch`; `default` não requer `break`; `case` pode não ter `break` (fall-through).

Q12: Código `switch(i)` com cases 0,10,20,30,40 — correto? → **E (scanf usa endereço da variável)**  
> `scanf("%d",&i)` passa endereço; `switch` não é laço; `printf` não é diretiva; `stdio.h` é header, não lib dinâmica.

Q13: Comando para evitar execução de cases incorretos no switch? → **A (break)**  
> `break` interrompe o switch; sem ele ocorre fall-through executando cases seguintes.

Q14: `idade=12` — quais exibem "Menor de idade"? → **B (I, II e III, apenas)**  
> I: ternário correto; II: if-else correto; III: if-else if correto; IV: `switch` não aceita intervalos (`case<18` inválido).

Q15: Lógica: x>0 → x++; x<0 → x--; x=0 → mantém → código? → **A (if(x>0) x++; if(x<0) x--;)**  
> Dois `if` independentes: primeiro incrementa se >0, segundo decrementa se <0; se 0, nenhum executa.

Q16: `for (ind=15; ind>=4; ind--)` → quantas iterações? → **A (12)**  
> 15,14,13,12,11,10,9,8,7,6,5,4 = 12 valores (15-4+1=12).

Q17: Assertivas sobre FOR/WHILE/DO-WHILE — V/F? → **A (V, V, V, F)**  
> I:V (FOR para contagem conhecida); II:V (WHILE precisa condição); III:V (DO-WHILE executa 1x); IV:F (WHILE executa ENQUANTO condição VERDADEIRA).

Q18: Descrição correta de for/while/do-while? → **A (for=conhecido; while=condição pode ser falsa no início; do-while=garante 1x)**  
> Definições padrão das três estruturas.

Q19: `for(ind=1;ind<=5;ind++) { scanf("%d",&num); if(num%2==0) soma+=num; }` entrada 2 4 8 5 7 → saída? → **A (14)**  
> Pares: 2+4+8=14; ímpares 5 e 7 ignorados.

Q20: Vetor para contar vogais até 'z' → preencher lacunas? → **B (rastrear, inteiros, análise)**  
> Vetor de inteiros conta frequência; "rastrear" = acompanhar; fim da "análise" ao achar 'z'.

Q21: Armazenar múltiplos dados relacionados → solução? → **A (vetores, bancos de dados, matrizes)**  
> Vetores para armazenamento temporário; depois bancos de dados; matrizes são vetores de vetores.

Q22: Buscar `NUM` em `VET[10]` — código correto? → **A (ind=0; achou=false; while(ind<10 && achou==false) { if(num==vet[ind]) achou=true; else ind++; })**  
> Inicializa `ind=0` e `achou=false`; condição `achou==false` (ou `!achou`); incrementa `ind` no `else`; para quando acha ou chega no fim.

Q23: [Continuação Q22 - código 2] → **B** (mesmo mas `achou=true` na condição → loop não executa)

Q24: [Continuação Q22 - código 3] → **C** (`ind=1` pula posição 0)

Q25: [Continuação Q22 - código 4] → **D** (`achou=true` na condição + `ind=1`)

Q26: [Continuação Q22 - código 5] → **E** (combinação dos erros acima)

Q27: [Tema 5 - Questões 6-10 similares: vetores, matrizes, busca, ordenação] → **Respostas: A, A, A, C, D**  
> Padrão: vetores para frequência/contagem; matrizes para tabuleiros; busca linear com flag; ordenação simples.

---

**Total: ~80 linhas | Conceitos agrupados | Exercícios: enunciado 1 linha → resposta + justificativa 1 linha**