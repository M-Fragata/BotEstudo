# Desenvolvimento Web em HTML5, CSS, JavaScript e PHP - Ficha de Prova

## 1. Arquitetura Web & Modelo Cliente-Servidor
- Comunicação via requisição e resposta HTTP/HTTPS; o cliente solicita e o servidor processa/armazena.
- **Servidor**: Máquinas de alta performance (data centers) que armazenam dados e executam a lógica de negócio.
- **Cliente**: Aplicações de visualização como browsers (Opera, Chrome, Firefox) que interpretam HTML/CSS/JS.
- **Design Responsivo & Mobile First**: Priorizar o desenvolvimento para dispositivos móveis com melhoramento progressivo.
- **Layouts Fluidos**: Adaptação dinâmica de telas para diferentes resoluções usando porcentagens e media queries.

## 2. HTML5 (Estruturação e Semântica)
- Especificação estrutural com tags derivadas da união de **SGML** e **HyTime**.
- Cabeçalho `<head>`: `<meta>` (metadados), `<title>` (título da aba), `<link>` (CSS externo e favicons).
- Mídias nativas: `<audio>` e `<video>` utilizam o atributo `controls` para habilitar play/pause/volume na interface.
- Listas: `<ul>` não ordenada, `<ol>` ordenada, `<dl>` lista de definição (`<dt>` termo, `<dd>` descrição).
- Tabelas: `<table>`, `<tr>` linha, `<td>` célula, `<th>` cabeçalho; mesclagem com `rowspan` (vertical) e `colspan` (horizontal).
- Imagens e Links: `<a href="...">` para hiperlinks; `<img src="..." alt="...">` (`alt` para acessibilidade/leitores de tela).

## 3. CSS3 (Apresentação e Estilização)
- Separa a apresentação visual do conteúdo HTML, reduzindo duplicação e facilitando manutenção.
- Aplicação: Externa (`<link>` no `<head>`), Interna (`<style>` no `<head>`) e Inline (`style="..."` no elemento).
- **CSS Box Model**: `content` → `padding` (espaço interno entre conteúdo e borda) → `border` → `margin` (espaço externo).
- Seletores: `#id` (elemento único), `.classe` (múltiplos elementos), `tag` (tipo de elemento).
- Tipografia e Cores: `font-weight: bold` (negrito); formatos válidos: Palavras-chave, Hexadecimal, RGB/RGBA e HSL/HSLA.
- Fluxo de Layout: Propriedade `position` altera o posicionamento padrão dos elementos no documento.

## 4. JavaScript & DOM (Interatividade no Cliente)
- Linguagem interpretada pelo navegador (front-end), fracamente tipada e com dimensionamento dinâmico.
- **Arrays**: Heterogêneos e dinâmicos indexados em 0; `shift()` remove o primeiro item; `pop()` remove o último.
- **DOM (Document Object Model)**: Interface de representação em árvore de nós e objetos manipulável via script.
- Controle de fluxo: `switch (var) { case val: ... break; default: ... }` (`break` encerra; `default` instrução padrão).
- **AJAX**: Requisições assíncronas em segundo plano sem travar a interface nem recarregar a página; trafega JSON, HTML e texto.
- `XMLHttpRequest`: Propriedade `responseText` recebe o corpo da resposta em texto/JSON enviado pelo servidor.

## 5. PHP (Processamento Server-Side)
- Linguagem executada no servidor; gera HTML dinâmico enviado ao cliente sem expor o código-fonte PHP.
- Delimitadores de código: `<?php` e `?>`; variáveis iniciadas com `$` (ex: `$x = 10;`).
- Operadores: `++$x` (pré-incrementa antes de avaliar), `$x++` (avalia e pós-incrementa), `--$x` (pré-decrementa).
- **Arrays Associativos**: Índices compostos por strings personalizadas usando chave `=>` valor (`$c = array('chave' => 'val');`).
- Funções essenciais: `count($arr)` retorna o total de elementos; `print_r($arr)` imprime estrutura completa com índices e valores.
- Estruturas de controle: `break` causa o término imediato de loops (`for`, `while`, `foreach`) e de `switch`.

## 6. PHP com Banco de Dados e Formulários
- Superglobais de formulário: `$_GET` (método GET), `$_POST` (método POST) e `$_REQUEST` (captura ambos).
- Conexão MySQLi Procedural: `$con = mysqli_connect("host", "user", "pass", "bd");` → `mysqli_query($con, $sql);` → `mysqli_close($con);`.
- Conexão PDO: `$dbh = new PDO('dsn', 'user', 'pass');` → `$dbh->exec("DELETE...")` retorna o número de linhas afetadas.
- POO em PHP: Construtor padrão declarado com `public function __construct($arg) { $this->campo = $arg; }`.

---

## Exercícios - Respostas Rápidas

### Tema 2: Ambiente Web Cliente X Servidor
Q1: Modelo cliente-servidor e armazenamento de dados → **A (Servidores)**
> Os servidores são computadores potentes destinados a armazenar dados e processar requisições.

Q2: Padrão arquitetural de software cliente e servidor → **C (Cliente-Servidor)**
> Arquitetura baseada em nós clientes fazendo requisições a um nó central provedor de serviços.

Q3: Associação de tecnologias: PHP, CSS e HTML → **D (2 - 1 - 3)**
> PHP (2) server-side open source; CSS (1) visual padronizado; HTML (3) linguagem de marcação.

Q4: Formas de acesso a dados e linguagens → **E (Formulários/APIs exigem linguagem server-side)**
> HTML e JS coletam/enviam dados, mas a comunicação com SGBD requer linguagem de servidor.

Q5: Layouts adaptáveis para dispositivos móveis → **B (Layouts fluidos)**
> Layouts fluidos adaptam dimensões proporcionalmente a diferentes resoluções de telas.

Q6: Exemplo prático de cliente web → **C (Navegador Opera)**
> Navegadores web atuam no lado cliente requisitando e renderizando páginas.

Q7: Afirmativas sobre HTML (programação, JS, tags, títulos) → **D (F, F, V, V)**
> HTML não é programação nem substitui JS; usa tags e possui múltiplos níveis de títulos (h1-h6).

Q8: Finalidade do CSS na web → **B (Descrever apresentação de arquivos HTML)**
> CSS foi concebido especificamente para definir a camada de exibição e estilo dos elementos HTML.

Q9: Técnicas de responsividade e mobile → **A (Mobile First)**
> Projetar primeiro para telas menores e expandir com melhoramento progressivo atende todos os dispositivos.

Q10: Identificação de sintaxe de código com variáveis `$v1` e `echo` → **E (PHP)**
> Uso de `<?`, variáveis com prefixo `$` e comando `echo` caracterizam a linguagem PHP.

### Tema 3: HTML (Linguagem de Marcação)
Q1: Padrões pré-existentes que originaram a HTML → **A (SGML e HyTime)**
> Tim Berners-Lee especificou o HTML original fundamentando-se no SGML e HyTime.

Q2: Tag de cabeçalho para CSS externo e favicons → **B (<link>)**
> A tag `<link rel="stylesheet">` é a responsável pela vinculação de arquivos externos no `<head>`.

Q3: Atributo para controles de vídeo/áudio → **C (controls)**
> O atributo booleano `controls` exibe os botões nativos de reprodução, pausa e volume.

Q4: Associação de tags HTML5 (`<br>`, `<div>`, `<!-- -->`, `<h1>`) → **D (2, 1, 4, 3)**
> `<br>` quebra linha (2), `<div>` cria seção (1), `<!-- -->` comentário (4), `<h1>` define título (3).

Q5: Mesclagem vertical de células em tabela → **B (rowspan)**
> `rowspan` mescla linhas verticalmente; `colspan` mescla colunas horizontalmente.

Q6: Tags de lista de definição → **C (<dl>, <dt> e <dd>)**
> `<dl>` cria a lista, `<dt>` o termo definido e `<dd>` a descrição do termo.

Q7: Função do atributo `alt` na tag `<img>` → **B (Texto alternativo e acessibilidade)**
> `alt` provê descrição textual para leitores de tela e em falhas de carregamento da imagem.

Q8: Identificação do trecho com tags `<ul>` e `<li>` → **C (Lista não ordenada)**
> `<ul>` define lista não ordenada por marcadores (bullets).

Q9: Melhorias esperadas em novas versões do W3C → **D (II, III e IV apenas)**
> Formalização de regras, correção de compatibilidade e novas tags (não visa aumentar tempo de resposta).

Q10: Finalidade da tag `<a>` → **B (Inserção de link)**
> A tag `<a>` (âncora) cria hiperlinks para navegação entre páginas e seções.

### Tema 4: CSS (Estilos e Apresentação)
Q1: Propriedade para texto em negrito → **C (font-weight: bold)**
> `font-weight` controla o peso da fonte, aceitando valores como `bold` ou numéricos (700).

Q2: Distância de 16px entre conteúdo e borda → **E (padding: 16px;)**
> `padding` define o espaçamento interno do box model entre o conteúdo e a sua borda.

Q3: Seletor CSS para atributo `id` → **A (#id)**
> `#` seleciona por ID, `.` seleciona por classe e `:` define pseudo-classes.

Q4: Responsabilidade do código CSS na aplicação → **D (Formatação visual do conteúdo)**
> CSS isola e gerencia exclusivamente a camada estética e de posicionamento visual.

Q5: Padrões válidos de cores em CSS → **D (HSL - RGB - números hexadecimais)**
> CSS aceita HSL, RGB (com ou sem alpha) e representações hexadecimais de cor.

Q6: Locais para declaração de regras CSS → **B (Documento separado, cabeçalho e dentro de tags)**
> Estilos podem ser externos (.css), internos (`<style>` no head) ou inline (atributo `style`).

Q7: Papel principal da folha de estilos CSS → **B (Descrever apresentação de arquivos HTML)**
> Define como elementos HTML devem ser renderizados visualmente em diferentes mídias.

Q8: Seção correta para declaração de CSS externo no HTML → **B (<head>)**
> Tags `<link>` para folhas de estilo externas devem residir dentro da seção `<head>`.

Q9: Propriedade para alterar o comportamento de fluxo e posição → **D (Position)**
> `position` (`static`, `relative`, `absolute`, `fixed`, `sticky`) manipula o esquema de coordenadas.

Q10: Papel do `padding` em relação ao box → **B (Área que separa bordas do conteúdo)**
> O preenchimento interno (`padding`) afasta as bordas do conteúdo renderizado.

### Tema 5: JavaScript e AJAX
Q1: Formatos de dados manipulados via AJAX além de XML → **B (HTML, texto puro e JSON)**
> AJAX trafega dados textuais flexíveis, sendo o JSON o formato mais utilizado na web moderna.

Q2: Características dos arrays em JavaScript → **A (Dimensionamento dinâmico e tipos múltiplos)**
> Arrays em JS não têm tamanho fixo prévio e suportam tipos de dados heterogêneos.

Q3: Método que remove e retorna o primeiro elemento do array → **B (shift())**
> `shift()` desenfileira o elemento do índice 0; `pop()` desempilha o último elemento.

Q4: Comandos ausentes no switch-case → **A (break e default)**
> `break` impede o fall-through entre casos e `default` trata valores não coincidentes.

Q5: Saída de `frutas.shift()` e `splice(1, 1, "uva")` → **C (laranja | uva |)**
> `shift` remove banana; `splice(1,1,"uva")` substitui limão por uva; restam laranja e uva.

Q6: Campo do XMLHttpRequest com corpo de resposta textual → **C (responseText)**
> `responseText` contém a resposta textual bruta enviada pelo servidor HTTP.

Q7: Conceitos sobre AJAX (atualização dinâmica, XML opcional, envio client) → **B (V - V - F)**
> AJAX atualiza páginas dinamicamente e XML é opcional; o XHR envia chamadas ao servidor (não ao client).

Q8: Saída da função com soma de dígitos da string "123123" → **D (Resultado: 12)**
> 1 + 2 + 3 + 1 + 2 + 3 = 12.

Q9: Definição da interface DOM → **B (Árvore de nós e objetos com propriedades e métodos)**
> O DOM é a representação padronizada do documento HTML em estrutura de árvore orientada a objetos.

Q10: Vantagem principal de requisições assíncronas → **C (Comunicação em background sem congelar a UI)**
> Processamento assíncrono impede travamento da navegação e elimina recarregamento total da tela.

### Tema 6: PHP (Páginas Dinâmicas)
Q1: Tags delimitadoras de código PHP → **A (<?php ?>)**
> O interpretador PHP processa apenas o código delimitado por `<?php` e `?>`.

Q2: Arrays com índices de strings personalizadas → **C (Arrays associativos)**
> Em PHP, vetores indexados por strings (chaves não numéricas) são denominados associativos.

Q3: Diferença de execução entre PHP e JavaScript no browser → **B (PHP processa no servidor gerando HTML)**
> O servidor executa o PHP e entrega somente o HTML final; o código-fonte PHP não é exposto ao cliente.

Q4: Acesso ao primeiro elemento de um array numérico em PHP → **E (echo $estados[0];)**
> Arrays numéricos iniciam a contagem no índice 0 (`$estados[0]`).

Q5: Papel da cláusula `default` na estrutura switch → **C (Executar instruções quando nenhum case coincidir)**
> `default` atua como cláusula de fallback caso nenhuma correspondência seja encontrada.

Q6: Comando para término imediato de loops em PHP → **C (break)**
> `break` interrompe a execução do laço de repetição ou do bloco `switch`.

Q7: Sintaxe correta para criação de array associativo → **D ($cadastro = array('CPF' => '123', ...))**
> A sintaxe canônica associa chaves e valores por meio do operador seta dupla `=>`.

Q8: Boas práticas e convenções de nomenclatura em PHP → **A (CamelCase ou underscore consistente e indentação)**
> Recomenda-se manter coerência de padrão (camelCase ou snake_case) e boa formatação do código.

Q9: Funções para contar itens e imprimir estrutura de array → **B (count() e print_r())**
> `count()` retorna a quantidade de itens e `print_r()` imprime chaves e valores formatados.

Q10: Saída de `echo ++$x; echo $y++; echo --$z;` para 10, 19, 28 → **C (11, 19 e 27)**
> `++$x` pré-incrementa para 11; `$y++` exibe 19 e vira 20; `--$z` pré-decrementa para 27.

### Tema 7: PHP com Banco de Dados
Q1: Lacunas para conexão e consulta MySQLi procedural → **C (mysqli_connect; localhost; bdConcurso; !mysqli_query; $sql; mysqli_close; $con;)**
> Conecta com `mysqli_connect`, valida execução com `!mysqli_query` e finaliza com `mysqli_close`.

Q2: Superglobais para formulários method="get" e method="post" → **E ($_GET, $_POST e $_REQUEST)**
> `$_GET` recupera URL/query string; `$_POST` corpo HTTP; `$_REQUEST` consolida ambos.

Q3: Método do PDO para comando DELETE retornando linhas afetadas → **C ($dbh->exec)**
> `$dbh->exec()` executa instruções SQL de modificação (INSERT, UPDATE, DELETE) retornando linhas afetadas.

Q4: Nomes das superglobais de captura de formulário → **B ($_GET, $_POST)**
> Padrões canônicos nativos do PHP para dados enviados de formulários.

Q5: Implementação de classe e construtor em PHP moderno → **A (class Usuario { ... __construct() })**
> Classes utilizam `class` e método mágico `__construct` para instanciação.

Q6: Função de conexão com banco de dados MySQL (legada) → **B ($conecta = mysql_connect("HOST", ...))**
> Sintaxe da biblioteca clássica `mysql_connect` com tratamento de erro.

---

## 7. Tema 8: Prepare (Praticando & Simulado Geral de Prova)

### Caso Prático Discursivo: Integração PHP com PostgreSQL via PDO & Prevenção de SQL Injection

#### Contexto do Caso
> O desenvolvedor júnior João precisa integrar um formulário HTML a um banco de dados PostgreSQL usando PHP. Ao inserir dados, ocorrem exceções de conexão, falhas de inserção e vulnerabilidades de **SQL Injection**. Ele não domina a classe **PDO** nem camadas de abstração segura.

#### Resposta Modelo para Prova / Avaliação

1. **Vantagens da Utilização da Classe PDO (PHP Data Objects)**:
   - **Camada de Abstração de Acesso a Dados**: O PDO padroniza métodos de conexão, consulta e manipulação independentemente do SGBD utilizado (PostgreSQL, MySQL, SQLite, Oracle). Se no futuro o banco for alterado, apenas a string DSN (*Data Source Name*) muda, mantendo as regras de negócio do código intactas.
   - **Suporte Nativo a PostgreSQL**: Permite conexão robusta e tipada via DSN `pgsql:host=localhost;port=5432;dbname=meubanco;user=...;password=...`.
   - **Tratamento de Exceções Estruturado**: Ativando o modo de erro `PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION`, qualquer falha gera uma `PDOException` tratável em blocos `try / catch`, impedindo o vazamento de credenciais ou dados do schema no navegador do usuário final.
   - **Controle Transacional Seguro**: Fornece controle de atomicidade (`beginTransaction()`, `commit()`, `rollBack()`), garantindo que operações complexas só sejam efetivadas se todas as etapas forem bem-sucedidas.

2. **Prevenção contra SQL Injection (Prepared Statements & Parameter Binding)**:
   - **Separação entre Código e Dados**: A principal causa de SQL Injection ocorre quando variáveis do usuário (`$_POST`) são concatenadas diretamente na string SQL (`"INSERT INTO usuarios VALUES ('" . $_POST['nome'] . "')"`).
   - **Instruções Preparadas (*Prepared Statements*)**: Com o PDO, a consulta é pré-compilada no banco usando marcadores nomeados (`:nome`, `:email`) ou posicionais (`?`) com `$stmt = $pdo->prepare("INSERT INTO clientes (nome, email) VALUES (:nome, :email)")`.
   - **Vinculação de Parâmetros (*Binding*)**: Ao utilizar `$stmt->bindValue(':nome', $nome, PDO::PARAM_STR)` ou passar o array no `$stmt->execute([':nome' => $nome])`, o PDO e o driver do PostgreSQL tratam os dados estritamente como literais, neutralizando qualquer caractere malicioso (`' OR 1=1; --`).

3. **Exemplo de Código Seguro em PHP com PDO e PostgreSQL**:
```php
<?php
try {
    $dsn = "pgsql:host=localhost;port=5432;dbname=empresa;";
    $pdo = new PDO($dsn, "postgres", "senha123", [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);

    // Sanitização e recebimento dos dados do formulário
    $nome = filter_input(INPUT_POST, 'nome', FILTER_SANITIZE_SPECIAL_CHARS);
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

    if ($nome && $email) {
        $sql = "INSERT INTO clientes (nome, email) VALUES (:nome, :email)";
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':nome', $nome, PDO::PARAM_STR);
        $stmt->bindValue(':email', $email, PDO::PARAM_STR);
        $stmt->execute();
        echo "Dados gravados com sucesso!";
    }
} catch (PDOException $e) {
    // Log seguro do erro no servidor sem expor detalhes ao usuário
    error_log("Erro PDO: " . $e->getMessage());
    echo "Erro ao processar sua solicitação. Tente novamente mais tarde.";
}
?>
```

---

### Desafios Práticos de Revisão (Simulado Tema 8)

#### Módulo 1: O Ambiente Web Cliente X Servidor
- **Desafio 1**: Propósito do CSS (Cascading Style Sheets) → **B**
  > *Resposta correta: Descrever a apresentação de arquivos no formato HTML, utilizando definições de exibição dos elementos deste arquivo.*
- **Desafio 2**: Formas de acesso e manipulação de dados na Web → **E**
  > *Resposta correta: É possível recuperar dados utilizando HTML, através de formulários, ou JavaScript, através de APIs. Em ambos os casos é necessária ainda uma linguagem server side.*
- **Desafio 3**: Conceito de Design Responsivo (item que **NÃO** se aplica) → **E**
  > *Resposta incorreta/assinalada: Como uma estratégia de desenvolvimento, recomenda-se começar o design responsivo pelas interfaces maiores e mais complexas. (A boa prática moderna é o **Mobile First**, iniciando nas menores e escalando).*

#### Módulo 2: Linguagem de Marcação HTML5
- **Desafio 1**: Função da tag `<a>` no HTML → **B**
  > *Resposta correta: Inserção de link (hiperlink para navegação).*
- **Desafio 2**: Validação e funcionamento de formulários HTML → **B**
  > *Resposta correta: A validação é um processo que pode ocorrer tanto no lado cliente quanto no lado servidor.*
- **Desafio 3**: Propósito e uso da tag `<select></select>` → **A**
  > *Resposta correta: Representar um controle que apresenta um menu de opções suspensas.*

#### Módulo 3: Linguagem de Marcação e Estilos (CSS)
- **Desafio 1**: Função do CSS em uma aplicação web → **D**
  > *Resposta correta: O código CSS irá cuidar da formatação visual do conteúdo apresentado.*
- **Desafio 2**: Formas de aplicação das regras CSS em um documento HTML → **B**
  > *Resposta correta: Em um documento separado fora de todos os documentos HTML (externo), no cabeçalho do documento HTML (interno/`<style>`) e dentro de cada tag HTML (inline/`style="..."`).*
- **Desafio 3**: Definição da folha de estilos CSS → **B**
  > *Resposta correta: Descrever a apresentação de arquivos no formato HTML, utilizando definições de exibição dos elementos deste arquivo.*

#### Módulo 4: Linguagem JavaScript
- **Desafio 1**: Saída do script `frutas = ["banana", "laranja", "limão"]; frutas.shift(); frutas.splice(1, 1, "uva");` → **C**
  > *Resposta correta: `Laranja | Uva |` (`shift()` remove 'banana'; `splice(1, 1, "uva")` substitui 'limão' por 'uva').*
- **Desafio 2**: Principal capacidade do AJAX no desenvolvimento moderno → **A**
  > *Resposta correta: Liberar o navegador web para outras operações enquanto atende outras requisições (comunicação assíncrona).*
- **Desafio 3**: Método JavaScript que remove o primeiro elemento de um array e o retorna → **B**
  > *Resposta correta: `shift()`.*

#### Módulo 5: Programação Dinâmica com PHP
- **Desafio 1**: Acesso a elemento no array `$x = array("a" => "europa", "america", "oceania", "asia");` para obter "oceania" → **A**
  > *Resposta correta: `$x[1]` (o índice numérico inicia em 0 para o primeiro elemento sem chave 'america', logo 'oceania' recebe o índice 1).*
- **Desafio 2**: Avaliação da igualdade `$x = 10; if ($x == '10')` → **A**
  > *Resposta correta: Sim, pois o operador `==` compara apenas o valor e não o tipo (diferente de `===` que compara valor e tipo).*
- **Desafio 3**: Saída dos laços aninhados de 1 a 9 e 1 a 10 multiplicando `$num1 * $num2` → **C**
  > *Resposta correta: A tabuada dos números 1 ao 9.*

#### Módulo 6: Integração de PHP com Banco de Dados
- **Desafio 1**: Nomes das variáveis superglobais de captura de dados de formulário HTML → **B**
  > *Resposta correta: `$_GET, $_POST`.*
- **Desafio 2**: Método do PDO para comando DELETE retornando linhas excluídas `$linhas = ..I.. ("DELETE FROM...");` → **C**
  > *Resposta correta: `$DBH->EXEC` (ou `$dbh->exec`).*
- **Desafio 3**: Variáveis predefinidas para `method="get"`, `method="post"` e ambos → **E**
  > *Resposta correta: `$_GET, $_POST e $_REQUEST`.*

