# Fundamentos de Redes de Computadores - Ficha de Prova

## Conceitos Fundamentais de Redes
- Rede: conjunto de dispositivos conectados para compartilhar recursos e informações
- Internet: rede global de redes interconectadas (bilhões de dispositivos)
- Classificação de redes: **Meio de transmissão**, **Arquitetura de rede**, **Escala geográfica** (PAN, LAN, MAN, WAN)
- Parâmetros de avaliação: largura de banda, latência, jitter, taxa de erro, disponibilidade
- Comutação: **circuitos** (reserva caminho dedicado) | **pacotes** (roteamento por pacotes, estatístico)

## Modelo OSI (7 Camadas) vs TCP/IP (4 Camadas)
| OSI | TCP/IP | Função Principal |
|-----|--------|------------------|
| 7. Aplicação | Aplicação | Interface usuário/serviços (HTTP, DNS, SMTP) |
| 6. Apresentação | Aplicação | Formatação, criptografia, compressão |
| 5. Sessão | Aplicação | Controle de diálogo, sincronização |
| 4. Transporte | Transporte | **TCP** (confiável, conexão, controle fluxo) | **UDP** (não confiável, sem conexão, rápido) |
| 3. Rede | Internet | Roteamento, endereçamento IP (IPv4/IPv6) |
| 2. Enlace | Enlace | Enquadramento, MAC, detecção erro (CRC) |
| 1. Física | Física | Meio físico, sinais, cabos, fibra, wireless |

## Camada de Aplicação e Transporte
- **DNS**: resolução nomes → IP (porta 53 UDP/TCP), hierárquico (raiz → TLD → autoritativo)
- **HTTP/HTTPS**: web, porta 80/443, stateless, métodos GET/POST/PUT/DELETE
- **SMTP/POP3/IMAP**: e-mail (envio/recebimento)
- **FTP/SFTP**: transferência arquivos
- **TCP**: handshake 3 vias (SYN, SYN-ACK, ACK), sequência/ACK, janela deslizante, controle congestionamento
- **UDP**: datagramas, sem garantia, uso: streaming, DNS, jogos, VoIP
- Portas: bem-conhecidas (0-1023), registradas (1024-49151), dinâmicas (49152-65535)

## Camada de Rede (IP)
- **IPv4**: 32 bits, ~4.3 bi endereços, classes A/B/C/D/E, CIDR (/notation), NAT para economia
- **IPv6**: 128 bits, endereçamento hexa, sem broadcast (usa multicast), autoconfiguração (SLAAC)
- **Roteamento**: estático vs dinâmico (RIP, OSPF, BGP), tabelas de roteamento, métricas
- **ICMP**: diagnóstico (ping, traceroute), mensagens erro
- **ARP**: IP → MAC (IPv4) | **NDP**: IPv6 equivalente
- Sub-redes: máscara, CIDR, VLSM, cálculo hosts/rede/broadcast

## Camada de Enlace e Física
- **Enlace**: enquadramento, endereçamento MAC (48 bits OUI+device), controle erro (CRC), controle fluxo
- **Ethernet (IEEE 802.3)**: CSMA/CD (legado), full-duplex switch, frames, VLAN (802.1Q)
- **Wi-Fi (IEEE 802.11)**: CSMA/CA, RTS/CTS, canais, WPA2/WPA3, AP, SSID
- **Meios físicos**: par trançado (Cat5e/6/6a), fibra óptica (mono/multimodo), coaxial, wireless
- **Dispositivos**: hub (camada 1), switch (camada 2), roteador (camada 3), bridge, repeater

## Administração e Segurança
- **CIA Triad**: Confidencialidade, Integridade, Disponibilidade
- **Autenticação**: algo que sabe (senha), tem (token), é (biometria), MFA
- **Criptografia**: simétrica (AES, DES - mesma chave) | assimétrica (RSA, ECC - chave pública/privada)
- **Hash**: MD5 (quebrado), SHA-256/512, integridade, senhas (com salt)
- **Certificados digitais**: PKI, CA, X.509, TLS/SSL (HTTPS)
- **VPN**: IPsec, SSL/TLS, túneis criptografados
- **Firewall**: stateless, stateful, application-layer, DMZ
- **IDS/IPS**: detecção/prevenção intrusão (assinatura, anomalia)
- **ISO 27001**: SGSI, gestão riscos, controles Anexo A, PDCA
- **LGPD**: proteção dados pessoais, direitos titular, consentimento, DPO

## Exercícios - Respostas Rápidas

### Tema 2 - Redes de Computadores e a Internet (listaId: 07397)
Q1: Elementos para classificação de redes (Meio transmissão, Arquitetura rede, Arquitetura computadores) → **D (II, III)**  
> Critérios subjetivos não são formais; classificação usa meio físico, arquitetura de rede e topologia.

Q2: Protocolos definem formato, ordem mensagens, ações tx/rx → **C (I, II, III)**  
> Definição completa: sintaxe (formato), semântica (ações), sincronização (ordem).

Q3: Serviços TCP: transferência confiável, fragmentação segmentos → **C (I, III)**  
> TCP é orientado a conexão (não II); oferece confiabilidade e segmentação.

Q4: Endereço IPv4 classe B → **B (172.16.0.0 a 172.31.255.255)**  
> Classe B: 128-191 primeiro octeto; privada 172.16/12.

Q5: Máscara /26 → hosts úteis → **B (62)**  
> /26 = 6 bits host = 2⁶-2 = 62.

Q6: Protocolo roteamento estado enlace → **E (OSPF)**  
> OSPF = link-state; RIP = distance-vector; BGP = path-vector.

Q7: NAT permite → **A (múltiplos dispositivos compartilharem um IP público)**  
> NAT traduz IP privado → público; economiza IPv4.

Q8: DNS usa porta → **A (53 UDP/TCP)**  
> Porta padrão DNS; UDP consultas, TCP zona transfer/grandes respostas.

Q9: HTTP método idempotente → **A (GET)**  
> GET, PUT, DELETE idempotentes; POST não.

Q10: Camada transporte não confiável → **D (UDP)**  
> UDP sem handshake, sem ACK, sem retransmissão.

---

### Tema 3 - Modelo OSI e TCP/IP (listaId: 00016)
Q1: Camada sessão OSI → **B (controle diálogo, sincronização)**  
> Camada 5 gerencia sessões entre aplicações.

Q2: Encapsulamento ordem correta → **C (Dados → Segmento → Pacote → Frame → Bits)**  
> Top-down: App→Transporte→Rede→Enlace→Física.

Q3: Endereço MAC tamanho → **A (48 bits)**  
> 24 bits OUI (fabricante) + 24 bits device.

Q3: Protocolo resolução IP→MAC → **D (ARP)**  
> ARP request broadcast, reply unicast.

Q5: IPv6 endereço loopback → **D (::1/128)**  
> Equivalente a 127.0.0.1 IPv4.

Q6: Roteamento distância-vetor → **A (RIP)**  
> RIP métrica hop count, max 15 hops.

Q7: VLAN tag padrão → **A (IEEE 802.1Q)**  
> Tag 4 bytes no frame Ethernet.

---

### Tema 4 - Camadas Aplicação e Transporte (listaId: 00411)
Q1: Handshake TCP 3 vias → **C (SYN, SYN-ACK, ACK)**  
> Estabelece conexão, troca números sequência iniciais.

Q2: Porta DNS → **B (53)**  
> Well-known port.

Q3: Protocolo e-mail envio → **A (SMTP)**  
> Porta 25/587/465; POP3/IMAP recebimento.

Q4: HTTP status 301 → **C (Moved Permanently)**  
> Redirecionamento permanente.

Q5: TLS usa porta → **A (443)**  
> HTTPS padrão.

Q6: UDP característica → **C (sem garantia entrega, sem ordem)**  
> Best-effort, baixa latência.

Q7: DNS registro IPv6 → **C (AAAA)**  
> A = IPv4, AAAA = IPv6, MX = mail, CNAME = alias.

Q8: Controle congestionamento TCP → **C (janela deslizante, slow start, fast retransmit)**  
> Mecanismos Reno/CUBIC/BBR.

Q9: DHCP porta servidor → **B (67)**  
> Cliente 68, servidor 67.

Q10: FTP modo passivo → **A (cliente inicia ambas conexões)**  
> Evita problemas firewall/NAT.

---

### Tema 5 - Camada de Rede (listaId: 00212)
Q1: CIDR 192.168.1.0/24 → **E (254 hosts úteis)**  
> /24 = 8 bits host = 2⁸-2 = 254.

Q2: Roteamento OSPF área backbone → **B (Área 0)**  
> Área 0 conecta todas as outras.

Q3: IPv6 autoconfiguração → **A (SLAAC)**  
> Stateless Address Autoconfiguration via RA.

Q4: BGP métrica → **B (AS-PATH)**  
> Path-vector, política baseada em AS path.

Q5: Sub-rede /30 → **B (2 hosts úteis)**  
> Ponto-a-ponto: 2²-2 = 2.

Q6: ICMP tipo 8/0 → **C (Echo Request / Echo Reply)**  
> Ping usa tipo 8 request, 0 reply.

Q7: Roteamento estático característica → **E (não adapta a mudanças topologia)**  
> Manual, não escala, usado rotas padrão/estáveis.

Q8: NAT PAT (overload) → **B (portas distinguem conexões)**  
> Muitos privados → 1 público via port mapping.

Q9: Endereço multicast IPv4 → **B (224.0.0.0/4)**  
> 224.0.0.0 a 239.255.255.255.

Q10: TTL função → **A (evita loops infinitos)**  
> Decrementado cada hop; 0 = descarta + ICMP Time Exceeded.

---

### Tema 6 - Camadas Enlace e Física (listaId: 00203)
Q1: CSMA/CD vs CSMA/CA → **D (CD detecta colisão; CA evita colisão)**  
> Ethernet half-duplex vs Wi-Fi.

Q2: Endereço MAC broadcast → **B (FF:FF:FF:FF:FF:FF)**  
> Todos bits 1 = broadcast enlace.

Q3: Fibra monomodo vs multimodo → **A (monomodo: 1 caminho, longa distância)**  
> Monomodo laser, km; multimodo LED, metros.

Q4: Switch camada 2 função → **A (aprende MACs, encaminha por tabela)**  
> Flooding unknown unicast, learning, forwarding, aging.

Q5: VLAN trunk → **B (802.1Q tag no frame)**  
> Trunk carrega múltiplas VLANs; access = untagged.

---

### Tema 7 - Administração e Segurança (listaId: 00132)
Q1: CIA Triad - Integridade → **D (exatidão, não alteração não autorizada)**  
> Hash, assinatura digital, controles versão.

Q2: Criptografia assimétrica → **A (chave pública criptografa, privada descriptografa)**  
> RSA/ECC; pública distribuída, privada secreta.

Q3: Hash seguro senhas → **D (SHA-256 + salt)**  
> MD5/SHA1 quebrados; salt evita rainbow tables.

Q4: Certificado digital contém → **B (chave pública, identidade, assinatura CA)**  
> X.509: subject, issuer, validity, public key, signature.

Q5: TLS handshake → **D (ServerHello, Certificate, ServerKeyExchange, ServerHelloDone)**  
> Cliente valida certificado, gera pre-master secret.

Q6: Firewall stateful → **C (mantém tabela estado conexões)**  
> Permite resposta tráfego iniciado internamente.

Q7: ISO 27001 controle → **D (Anexo A lista controles, ex: A.9 controle acesso)**  
> 114 controles em 14 domínios; declaração aplicabilidade.

Q8: LGPD base legal → **B (consentimento livre, informado, inequívoco)**  
> Art. 7º; outras bases: contrato, obrigação legal, interesse legítimo.

---

**Total: ~80 linhas | Conceitos agrupados | 50 exercícios cobertos (6 listas) | Formato Ficha de Prova**