# Resumo e Gabarito - Arquitetura de Computadores

**Código:** DGT0281 / estacio_15346173  
**Período:** Segundo Período  
**Status:** ✅ 100% Concluído (Conteúdos e Exercícios finalizados com nota máxima)

---

## 📌 Tema 2 - Base Computacional

### Tópicos Chave
- **Circuitos Integrados (CI):** A grande revolução dos CIs foi a miniaturização drástica (diminuição do tamanho dos circuitos), redução do consumo e viabilização dos microcomputadores.
- **Componentes Centrais de Hardware:** Processador (CPU), Memória RAM e Placa-Mãe são os pilares essenciais de um computador pessoal.
- **Memória Cache:** Integrada no processador (SRAM ultrarrápida), reduz a latência e o gargalo de barramento com a memória principal (DRAM).
- **Escalonador (Scheduler):** Componente do SO responsável por alocar frações de tempo da CPU para os processos concorrentes.
- **Redes & Internet:** A infraestrutura global e transporte de datagramas baseia-se em **Roteadores**. O projeto pioneiro foi a **ARPANET**. O **IPv4** é composto por 4 blocos de 8 bits (32 bits no total).

### Gabarito dos Exercícios (Lista 00403)
1. **C** - Diminuição de tamanho do circuito.
2. **C** - Processador e memória RAM.
3. **C** - Decidir a alocação de tempo do processador para programas em execução.
4. **B** - Roteadores.
5. **C** - É uma sequência de quatro números de oito bits cada, usados para identificar unicamente um computador conectado em um conjunto de redes interligadas.
6. **E** - Memória RAM, processador e placa-mãe.
7. **B** - ARPANET.
8. **E** - Fica presente no processador e aumenta a eficiência por ser mais rápida que a memória principal.
9. **B** - I, III e IV, apenas (Notificações, carga da bateria e leitura do touchscreen).
10. **D** - III e IV, apenas (Projetor de vídeo e Impressora 3D são dispositivos de saída).

---

## 📌 Tema 3 - Componentes de Hardware

### Tópicos Chave
- **Memória DDR-SDRAM:** Double Data Rate transfere dados tanto na borda de subida quanto na borda de descida do clock.
- **Assembly:** Linguagem de baixo nível mnemônica, mapeada 1:1 para a arquitetura do conjunto de instruções do processador.
- **Implementação / Organização vs. Arquitetura:** A implementação lida com aspectos de hardware transparentes ao programador (detalhes de circuitos, interconexões físicas).
- **Unidade de Controle (UC):** Coordena e gerencia o fluxo e movimentação de dados e instruções de E/S.
- **Princípio da Localidade:**
  - *Localidade Temporal:* Tendência de acessar o mesmo endereço de memória repetidas vezes em curto intervalo de tempo.
  - *Localidade Espacial:* Tendência de acessar endereços adjacentes próximos.
- **Barramento (Bus):** Linhas condutoras que transportam sinais de dados, endereço e controle entre componentes.
- **Núcleo (Kernel):** O coração do sistema operacional que fornece abstração e serviços essenciais.

### Gabarito dos Exercícios (Lista 00248)
1. **D** - DDR-SDRAM transfere dados na subida e na descida do sinal de clock.
2. **E** - Assembly.
3. **B** - Implementação de Computadores.
4. **A** - Unidade de Controle - UC.
5. **E** - Localidade temporal.
6. **B** - Transportar sinais de informação e controle entre componentes interligados.
7. **E** - Núcleo.
8. **D** - Os sistemas multiprogramáveis permitem que vários programas sejam executados simultaneamente.
9. **B** - Instrução.

---

## 📌 Tema 4 - Representação de Dados

### Tópicos Chave
- **Representação de Caracteres:** Padrões codificados como ASCII e Unicode mapeiam sequências binárias em caracteres legíveis.
- **Sistemas Posicionais:** O valor de um dígito depende da sua posição relativa multiplicada pela potência da base (ex: binário, decimal, hexadecimal).
- **Operações Lógicas:** Operações booleanas fundamentais em circuitos lógicos (AND, OR, NOT, XOR).
- **Instruções e Palavras:** O Instruction Set Architecture (ISA) define o significado formal dos códigos binários (opcodes e operandos) decodificados pela CPU.

### Gabarito dos Exercícios (Lista 00432)
1. **C** - Por meio de códigos ASCII.
2. **B** - Facilita a conversão entre diferentes bases numéricas.
3. **A** - Posicionais - conversão - binária.
4. **C** - AND.
5. **B** - Numeração - Operações - Representação.
6. **B** - Somente as afirmativas I e II estão corretas.
7. **D** - Nível de usuário.
8. **C** - Um valor binário (0 ou 1).
9. **C** - Somente as afirmativas I e III estão corretas.
10. **C** - O conjunto de instruções estabelece a correspondência entre códigos binários e operações específicas, permitindo que o processador reconheça o significado de cada palavra binária recebida.

---

## 📌 Tema 5 - Lógica Digital

### Tópicos Chave
- **Álgebra Booleana:** Fundamentada por George Boole e aplicada a circuitos chaveados/comutadores por Claude Shannon em 1938.
- **Precedência de Operadores Lógicos:** `NOT` primeiro, depois `AND` e por fim `OR`.
- **Portas Lógicas Fundamentais:**
  - *AND:* Saída 1 se e somente se ambas as entradas forem 1.
  - *OR:* Saída 0 se e somente se ambas as entradas forem 0.
  - *XNOR:* Porta de coincidência; saída 1 se e somente se as entradas forem iguais (0-0 ou 1-1).
- **Leis Fundamentais:**
  - *Lei da Identidade:* $A + 0 = A$ e $A \cdot 1 = A$.
- **Níveis Lógicos & Tensões:** Bit 0 representa estado desligado (tensão baixa / 0V) e Bit 1 representa estado ligado (tensão alta / Vcc).
- **Tabela-Verdade:** Mapeamento exaustivo de todas as combinações de entrada e seus respectivos estados de saída.

### Gabarito dos Exercícios (Lista 00105)
1. **B** - S = 011
2. **B** - Se e somente se ambas as entradas, A e B, possuírem valor 0.
3. **B** - Projeto e análise de circuitos com comutadores.
4. **D** - NOT primeiro, depois AND e por fim OR.
5. **A** - (A . F) . (C + P)
6. **B** - Descrever a saída de um circuito listando todas as combinações possíveis das variáveis de entrada e seus respectivos resultados.
7. **B** - Produz 1 se e somente se as entradas forem iguais (ambas 0 ou ambas 1).
8. **A** - A saída será 1 se e somente se ambas as entradas forem 1.
9. **C** - Lei da Identidade.
10. **B** - O bit 0 representa o estado desligado (tensão baixa) e o bit 1 representa o estado ligado (tensão alta).

---

## 📌 Tema 6 - Processamento em Paralelo

### Tópicos Chave
- **Taxonomia de Flynn (1966):**
  - *SISD (Single Instruction, Single Data):* Monoprocessadores tradicionais sequenciais.
  - *MISD (Multiple Instruction, Single Data):* Máquina puramente teórica com pouca ou nenhuma implementação prática.
  - *SIMD (Single Instruction, Multiple Data):* Processadores vetoriais e matriciais; mesma instrução aplicada a grandes blocos/conjuntos de dados simultaneamente.
  - *MIMD (Multiple Instruction, Multiple Data):* Múltiplos processadores independentes com instruções e dados separados (SMP, Clusters, NUMA).
- **Pipelining:** Sobreposição de operações de estágios de instruções que acelera a vazão (throughput) geral.
- **Superescalar vs. Superpipeline:**
  - *Superescalar:* Replicação de unidades funcionais/executivas para despachar e executar múltiplas instruções em paralelo no mesmo ciclo de clock, com suporte a execução fora de ordem (*out-of-order*).
  - *Superpipeline:* Fatiamento do pipeline em mais estágios curtos para elevar a frequência de clock.
- **Multicore:** Aumento da eficiência energética e desempenho em dispositivos móveis e desktops.
- **Coerência de Cache:** Protocolos essenciais em multiprocessadores para assegurar a consistência e validade dos dados compartilhados entre caches locais.

### Gabarito dos Exercícios (Lista 00394)
1. **C** - Melhoria na eficiência energética e desempenho.
2. **E** - As afirmações I, II e III.
3. **C** - MISD.
4. **C** - SIMD atende a necessidade de operações paralelas em múltiplos dados.
5. **B** - Executa várias instruções simultaneamente em diferentes núcleos.
6. **B** - Arquitetura SIMD, ideal para aplicar a mesma instrução em múltiplos conjuntos de dados.
7. **D** - Protocolos de coerência de cache asseguram a consistência dos dados entre caches.
8. **B** - Apenas as afirmativas I e III estão corretas.
9. **C** - Melhoria na Eficiência de Processamento de Dados.
10. **D** - Execução de instruções de forma independente e possivelmente fora de ordem.

---

## 📌 Tema 7 - Arquitetura CISC X RISC

### Tópicos Chave
- **CISC (Complex Instruction Set Computer):**
  - Grande quantidade de instruções de tamanho variável.
  - Endereçamento múltiplo e complexo que permite operações diretamente na memória principal.
  - Unidade de controle complexa e microprogramada ocupando grande porção do chip.
- **RISC (Reduced Instruction Set Computer):**
  - Conjunto de instruções pequeno, simples e altamente otimizado.
  - Instruções de **tamanho fixo** (geralmente 4 bytes) executadas em ciclo único.
  - Arquitetura estritamente **Load/Store**: operações ocorrem exclusivamente em registradores.
  - Grande banco de **registradores de uso geral**.
  - Unidade de controle cabeada (*hardwired*), simples, liberando espaço no chip para registradores e cache.
  - Ideal para smartphones, tablets e dispositivos com restrição térmica/energética (como núcleos ARM).

### Gabarito dos Exercícios (Lista 00436)
1. **B** - O endereçamento múltiplo traz flexibilidade, permitindo operações diretamente em operandos na memória principal, além dos presentes nos registradores.
2. **D** - Processador D: 16 registradores, 30 instruções de 4 bytes de tamanho.
3. **C** - RISC emprega um conjunto de instruções pequeno e altamente otimizado.
4. **E** - O maior número de registradores está na arquitetura RISC.
5. **B** - O endereçamento múltiplo traz flexibilidade, permitindo operações diretamente em operandos na memória principal, além dos presentes nos registradores.
6. **B** - Priorizava execução em registradores, aumentando a eficiência dos programas.
7. **D** - Registradores de uso geral e unidade de controle.
