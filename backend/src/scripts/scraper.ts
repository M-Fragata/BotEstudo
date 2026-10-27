import { chromium } from 'playwright';
import type { Page } from 'playwright';

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { chamarLLM, extrairJSON } from '../utils/nvidiaLLM.js';
config();
config({ path: path.join(import.meta.dirname, '..', '..', '..', '.env') });
config({ path: path.join(import.meta.dirname, '..', '..', '.env') });

const RESUMOS_DIR = path.join(import.meta.dirname, '..', '..', 'resumos', process.env.PERIODO || 'secondPeriod', 'raw');

function montarPromptExercicios(listas: any[]): string {
    const exerciciosFormatados = listas.map(lista => {
        const questoesFormatadas = lista.questoes.map((q: any) => {
            const alts = q.alternativas.map((a: any) => `  ${a.letra}) ${a.texto}`).join('\n');
            return `Questão ${q.numero}:\n${q.enunciado}\n${alts}`;
        }).join('\n\n');
        return `Lista: ${lista.listaId}\n${questoesFormatadas}`;
    }).join('\n\n---\n\n');
    return `Analise as questões abaixo e determine a alternativa correta de cada uma.

Ao final, OBRIGATORIAMENTE inclua o JSON com todas as respostas no formato:

{
  "listaId": {
    "numeroQuestao": "LETRA"
  }
}

EXEMPLO:
{
  "47261": {
    "1": "C",
    "2": "A",
    "3": "B"
  }
}

${exerciciosFormatados}`;
}

async function analisarExercicios(listas: any[]): Promise<Record<string, Record<number, string>> | null> {
    const prompt = montarPromptExercicios(listas);
    const resposta = await chamarLLM(prompt);
    try {
        return extrairJSON(resposta) as Record<string, Record<number, string>>;
    } catch {
        console.log('  ❌ Falha ao parsear resposta da LLM');
        return null;
    }
}

async function loginMicrosoft(page: Page, user: string, pass: string) {
    await page.waitForSelector('button:has-text("Entrar")', { timeout: 15000 });
    await page.click('button:has-text("Entrar")');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    await page.fill('input[type="email"]', user);
    await page.click('input[type="submit"], button:has-text("Avançar"), button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    await page.waitForSelector('input[type="password"]', { timeout: 15000 });
    await page.fill('input[type="password"]', pass);
    await page.click('input[type="submit"], button:has-text("Entrar"), button[type="submit"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await lidarComDialogosPosLogin(page);
}

async function lidarComDialogosPosLogin(page: Page) {
    const botoesDialogo = [
        'input[value="Não"]',
        'input[value="Sim"]',
        'button:has-text("Não")',
        'button:has-text("Sim")',
        'button:has-text("Continuar")',
        'button:has-text("Avançar")',
        'button:has-text("OK")',
        'button:has-text("Aceitar")',
        'button:has-text("Permitir")',
        '#idBtn_Back',
    ];

    for (const seletor of botoesDialogo) {
        try {
            await page.waitForSelector(seletor, { timeout: 3000 });
            await page.click(seletor);
            console.log(`  ✅ Clicou em: ${seletor}`);
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            break;
        } catch { }
    }

    const url = page.url();
    if (url.includes('login.microsoftonline.com')) {
        console.log('  ⚠️ Ainda na página Microsoft, aguardando...');
        await page.waitForTimeout(5000);
    }
}


async function navegarParaDisciplinas(page: Page) {
    const rotas = [
        '/disciplinas',
    ];

    for (const rota of rotas) {
        try {
            await page.goto(`https://estudante.estacio.br${rota}`, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(3000);

            const temDisciplinas = await page.evaluate(() => {
                const textos = document.body.innerText.toLowerCase();
                return textos.includes('disciplina') || textos.includes('matéria') || textos.includes('grade');
            });

            if (temDisciplinas) {
                console.log(`✅ Encontrado em: ${rota}`);
                return;
            }
        }
        catch (err) {
            console.log(`  ⚠️ Erro ao acessar ${rota}: ${err instanceof Error ? err.message : err}`);
            continue;
        }
    }
    // Fallback: tentar página inicial
    try {
        await page.goto('https://estudante.estacio.br/', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(3000);
    } catch (err) {
        console.log(`  ⚠️ Erro ao acessar página inicial: ${err instanceof Error ? err.message : err}`);
    }
}

async function extrairDisciplinas(page: Page) {
    try {
        await page.waitForSelector('[data-testid^="card-disciplina-v2-"]', { timeout: 15000 });
        await page.waitForTimeout(3000);
    }
    catch {
        console.log('  ⚠️ Nenhum card de disciplina encontrado após 15s');
        return [];
    }
    const count = await page.$$eval('[data-testid^="card-disciplina-v2-"]', els => els.length);
    console.log(`  📚 Encontrado(s) ${count} card(s) de disciplina`);
    if (count === 0)
        return [];
    const rawData = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid^="card-disciplina-v2-"]');
        const data: Array<{ testId: string, titulo: string, widgetConteudo: string, widgetExercicio: string, widgetSimulado: string, valor: string, botaoAcessar: boolean }> = [];
        cards.forEach((card) => {
            const hasBtn = !!(
                card.querySelector('[data-testid="botao-acessar-disciplina"]') ||
                card.querySelector('[data-testid="botao-continuar-disciplina"]') ||
                card.querySelector('[data-testid*="acessar"]') ||
                card.querySelector('[data-testid*="continuar"]') ||
                card.querySelector('button') ||
                card.querySelector('a')
            );
            data.push({
                testId: card.getAttribute('data-testid') || '',
                titulo: card.querySelector('h2')?.textContent?.trim() || '',
                widgetConteudo: card.querySelector('[data-testid="widget-progresso-conteudo"] small')?.textContent?.trim() || '0/0',
                widgetExercicio: card.querySelector('[data-testid="widget-progresso-exercicio"] small')?.textContent?.trim() || '0/0',
                widgetSimulado: card.querySelector('[data-testid="widget-progresso-simulado"] small')?.textContent?.trim() || '0/0',
                valor: card.querySelector('[data-testid="barra-progresso-disciplina"] progress')?.getAttribute('value') || '0',
                botaoAcessar: hasBtn
            });
        });
        return data;
    });
    console.log(`  📚 rawData retornou ${rawData.length} item(s)`);
    if (rawData.length === 0)
        return [];
    console.log('  🔍 Primeiro card rawData:', JSON.stringify(rawData[0], null, 2));
    function isCompleto(progresso: string): boolean {
        const m = progresso.match(/(\d+)\/(\d+)/);
        if (!m || m[1] === undefined || m[2] === undefined)
            return false;
        return parseInt(m[2]) > 0 && parseInt(m[1]) >= parseInt(m[2]);
    }
    const disciplinas = rawData.map(d => ({
        nome: d.titulo,
        codigo: d.testId.replace('card-disciplina-v2-', ''),
        completa: isCompleto(d.widgetConteudo) && isCompleto(d.widgetExercicio),
        progressoConteudo: d.widgetConteudo,
        progressoExercicio: d.widgetExercicio,
        progressoSimulado: d.widgetSimulado,
        porcentagem: parseInt(d.valor),
        temBotao: d.botaoAcessar,
        urlId: '',
        aulas: []
    }));
    console.log(`  📚 extrairDisciplinas retornou ${disciplinas.length} disciplina(s)`);
    return disciplinas;
}

function conteudoCompleto(d: any): boolean {
    const match = d.progressoConteudo.match(/(\d+)\/(\d+)/);
    return !!match && match[1] !== undefined && match[2] !== undefined && parseInt(match[1]) >= parseInt(match[2]);
}

function exercicioCompleto(d: any): boolean {
    const match = d.progressoExercicio.match(/(\d+)\/(\d+)/);
    if (!match || match[1] === undefined || match[2] === undefined)
        return false;
    const atual = parseInt(match[1]);
    const total = parseInt(match[2]);
    return total > 0 && atual >= total;
}

async function closeTaciaModal(page: Page) {
    try {
        // Tenta clicar no botão de minimizar oficial da Tácia
        const botaoMinimizar = page.locator('button[data-element="button_minimizar-chat-interno"], button[data-testid="minimize-button"], button[aria-label="Minimizar chat"]').first();
        if (await botaoMinimizar.isVisible({ timeout: 3000 }).catch(() => false)) {
            await botaoMinimizar.click({ force: true });
            console.log('  ✅ Clicou em minimizar o chat da Tácia');
            await page.waitForTimeout(1000);
        }
    } catch { }

    // Remove do DOM todo e qualquer elemento do chat-drawer ou overlay para garantir que nunca intercepte cliques
    try {
        await page.evaluate(() => {
            const seletores = [
                'section[data-testid="chat-drawer"]',
                'section[aria-label*="Assistente de IA"]',
                '[data-lift="lft-drawer"]',
                '[data-testid="section-chat-assistente-pessoal"]',
                '.css-irhci0',
                '.css-wg5e3x'
            ];
            seletores.forEach(s => {
                document.querySelectorAll(s).forEach(el => el.remove());
            });
        });
        console.log('  🧹 Limpeza do modal/drawer da Tácia concluída no DOM');
    } catch { }
}

async function extrairUrlId(page: Page, disciplina: any): Promise<string> {
    // Garante que o modal da Tácia esteja fechado e removido do DOM
    await closeTaciaModal(page);

    const cardSeletor = `[data-testid="card-disciplina-v2-${disciplina.codigo}"]`;
    const cardLoc = page.locator(cardSeletor).first();
    await cardLoc.scrollIntoViewIfNeeded().catch(() => { });
    await page.waitForTimeout(1000);

    const candidateSelectors = [
        `${cardSeletor} [data-testid="botao-acessar-disciplina"]`,
        `${cardSeletor} [data-testid="botao-continuar-disciplina"]`,
        `${cardSeletor} [data-element="button_acessar-disciplina"]`,
        `${cardSeletor} [data-element="button_continuar-disciplina"]`,
        `${cardSeletor} button:has-text("Acessar"):not([data-element*="detalhe"]):not([aria-label*="detalhe"])`,
        `${cardSeletor} button:has-text("Continuar")`,
        `${cardSeletor} a:has-text("Acessar")`,
        `${cardSeletor} a:has-text("Continuar")`,
        `${cardSeletor} h2`,
        `${cardSeletor} [data-lift="lft-cardshape"]`,
        cardSeletor
    ];

    let foundSelector = '';
    for (const sel of candidateSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible().catch(() => false)) {
            foundSelector = sel;
            break;
        }
    }

    if (!foundSelector) {
        try {
            await page.waitForSelector(`${cardSeletor} [data-testid="botao-acessar-disciplina"], ${cardSeletor} button:has-text("Acessar")`, { timeout: 8000 });
            for (const sel of candidateSelectors) {
                const el = page.locator(sel).first();
                if (await el.isVisible().catch(() => false)) {
                    foundSelector = sel;
                    break;
                }
            }
        } catch { }
    }

    if (!foundSelector) {
        console.log(`  ⚠️ Botão de acesso não encontrado para ${disciplina.nome}`);
        const fullCardHtml = await cardLoc.evaluate(el => el.outerHTML).catch(() => 'erro');
        console.log(`  🔍 HTML COMPLETO do card (${disciplina.codigo}):\n`, fullCardHtml);
        return '';
    }

    console.log(`  🎯 Acessando disciplina via: ${foundSelector}`);
    const btnLoc = page.locator(foundSelector).first();
    await btnLoc.scrollIntoViewIfNeeded().catch(() => { });
    await page.waitForTimeout(500);

    await Promise.all([
        page.waitForURL(url => url.toString().includes('/disciplinas/estacio_'), { timeout: 20000 }).catch(() => { }),
        btnLoc.click({ force: true })
    ]);

    await page.waitForTimeout(3000);
    const urlAtual = page.url();
    console.log(`  🌐 URL após clicar Acessar: ${urlAtual}`);
    const match = urlAtual.match(/disciplinas\/([^/]+)/);
    const urlId = match && match[1] ? match[1] : '';
    console.log(`  🔗 URL ID extraído: ${urlId}`);
    await page.goBack({ waitUntil: 'networkidle' }).catch(() => { });
    await page.waitForTimeout(2000);
    return urlId;
}

function conteudoEhErro(texto: string): boolean {
    const padroesErro = [
        /internal\s*server\s*error/i,
        /\b500\b.*error/i,
        /erro\s*interno/i,
        /something\s*went\s*wrong/i,
        /unable\s*to\s*process/i,
        /temporarily\s*unavailable/i,
        /application\s+error/i,
        /client-side\s+exception/i,
        /window\.addEventListener\s*\(/,
        /window\.onerror/,
        /function\s*\(\s*\)\s*\{.*addEventListener/,
    ];
    return padroesErro.some(p => p.test(texto));
}

interface StatusConclusao {
    concluido: boolean;
    tempoGasto: number;
    temTimer: boolean;
    botaoExiste: boolean;
    botaoHabilitado: boolean;
    textoBotao: string;
}

async function lerStatusConclusao(page: Page): Promise<StatusConclusao> {
    return await page.evaluate(() => {
        // 1. Verificar tags/badges de status na página
        const tags = Array.from(document.querySelectorAll('[data-testid="tag-concluido"], [data-testid="card-tag"], [class*="tag"]'));
        for (const tag of tags) {
            const txt = (tag.textContent || '').trim().toLowerCase();
            const aria = (tag.getAttribute('aria-label') || '').trim().toLowerCase();
            if (txt === 'concluído' || txt === 'concluido' || aria === 'concluído' || aria === 'concluido') {
                return {
                    concluido: true,
                    tempoGasto: 15 * 60,
                    temTimer: false,
                    botaoExiste: true,
                    botaoHabilitado: false,
                    textoBotao: txt || aria
                };
            }
        }

        // 2. Localizar botão principal de conclusão
        const btnConcluir = document.querySelector<HTMLElement>('[data-element="button_marcar-como-concluido"]');
        if (btnConcluir) {
            const texto = (btnConcluir.textContent || '').trim();
            const ariaLabel = (btnConcluir.getAttribute('aria-label') || '').trim();
            const disabled = btnConcluir.hasAttribute('disabled') || btnConcluir.getAttribute('aria-disabled') === 'true';
            const textoCompleto = `${texto} ${ariaLabel}`.toLowerCase();

            // Se o botão diz explicitamente "Concluído" (e não "marcar como concluído")
            const botaoDizConcluido = (textoCompleto.includes('conclu') || ariaLabel.toLowerCase().includes('conclu')) &&
                !textoCompleto.includes('marcar') && !ariaLabel.toLowerCase().includes('marcar');

            // Timer MM:SS
            const match = texto.match(/(\d{2}):(\d{2})/);
            if (match && match[1] && match[2]) {
                const minutos = parseInt(match[1]);
                const segundos = parseInt(match[2]);
                return {
                    concluido: botaoDizConcluido,
                    tempoGasto: minutos * 60 + segundos,
                    temTimer: true,
                    botaoExiste: true,
                    botaoHabilitado: !disabled,
                    textoBotao: texto
                };
            }

            return {
                concluido: botaoDizConcluido,
                tempoGasto: 15 * 60,
                temTimer: false,
                botaoExiste: true,
                botaoHabilitado: !disabled,
                textoBotao: texto
            };
        }

        // 3. Fallback: procurar outros botões que contenham "conclu"
        const todosBotoes = Array.from(document.querySelectorAll('button'));
        const btnAlt = todosBotoes.find(b => {
            const t = (b.textContent || '').toLowerCase();
            const aria = (b.getAttribute('aria-label') || '').toLowerCase();
            return t.includes('conclu') || aria.includes('conclu');
        });

        if (btnAlt) {
            const texto = (btnAlt.textContent || '').trim();
            const aria = (btnAlt.getAttribute('aria-label') || '').trim();
            const disabled = btnAlt.hasAttribute('disabled') || btnAlt.getAttribute('aria-disabled') === 'true';
            const ehConcluido = (texto.toLowerCase().includes('concluído') || aria.toLowerCase().includes('concluído')) &&
                !texto.toLowerCase().includes('marcar') && !aria.toLowerCase().includes('marcar');

            return {
                concluido: ehConcluido,
                tempoGasto: 15 * 60,
                temTimer: false,
                botaoExiste: true,
                botaoHabilitado: !disabled,
                textoBotao: texto || aria
            };
        }

        return {
            concluido: false,
            tempoGasto: 15 * 60,
            temTimer: false,
            botaoExiste: false,
            botaoHabilitado: false,
            textoBotao: ''
        };
    });
}

async function esperarTimerEConcluir(page: Page): Promise<boolean> {
    const TEMPO_MINIMO_SEGUNDOS = 15 * 60;
    const BUFFER_EXTRAS_SEGUNDOS = 10;

    let status = await lerStatusConclusao(page);
    console.log(`        📊 Status do botão: Concluído=${status.concluido}, Botão=${status.botaoExiste ? `"${status.textoBotao}"` : 'não encontrado'}, Timer=${status.temTimer ? `${Math.floor(status.tempoGasto / 60)}m${status.tempoGasto % 60}s` : 'sem timer'}`);

    if (status.concluido) {
        console.log(`        ✅ Tema/item já se encontra marcado como CONCLUÍDO!`);
        return true;
    }

    if (!status.botaoExiste) {
        console.log(`        ⚠️ Botão de conclusão não encontrado na página atual`);
        return false;
    }

    // Se possui timer MM:SS e ainda falta tempo
    if (status.temTimer && status.tempoGasto < TEMPO_MINIMO_SEGUNDOS) {
        const segundosRestantes = TEMPO_MINIMO_SEGUNDOS - status.tempoGasto + BUFFER_EXTRAS_SEGUNDOS;
        const minutosRestantes = Math.ceil(segundosRestantes / 60);
        console.log(`        ⏱️ Tempo gasto atual: ${Math.floor(status.tempoGasto / 60)}m${status.tempoGasto % 60}s / 15m00s`);
        console.log(`        ⏳ Aguardando ~${minutosRestantes} minutos (${segundosRestantes}s) para liberar o botão de conclusão...`);

        let tempoEspera = segundosRestantes;
        while (tempoEspera > 0) {
            const passo = Math.min(tempoEspera, 30);
            await page.waitForTimeout(passo * 1000);
            tempoEspera -= passo;

            const checagem = await lerStatusConclusao(page);
            if (checagem.concluido) {
                console.log(`        ✅ Status mudou para concluído durante a espera!`);
                return true;
            }
            if (checagem.temTimer) {
                const restanteReal = Math.max(0, TEMPO_MINIMO_SEGUNDOS - checagem.tempoGasto);
                if (restanteReal === 0 && checagem.botaoHabilitado) {
                    console.log(`        🎯 Timer atingiu os 15 minutos! Prosseguindo para conclusão.`);
                    break;
                }
            }
        }
    }

    // Clicar e verificar ativamente se o status mudou para concluído
    for (let tentativa = 1; tentativa <= 4; tentativa++) {
        console.log(`        🖱️ Clicando em "Marcar como concluído" (tentativa ${tentativa}/4)...`);

        const clicou = await page.evaluate(() => {
            const btn = document.querySelector<HTMLElement>('[data-element="button_marcar-como-concluido"]');
            if (btn) {
                btn.click();
                return true;
            }
            const todos = Array.from(document.querySelectorAll('button'));
            const btnTxt = todos.find(b => {
                const t = (b.textContent || '').toLowerCase();
                return t.includes('marcar como') || t.includes('concluir');
            });
            if (btnTxt) {
                btnTxt.click();
                return true;
            }
            return false;
        });

        if (!clicou) {
            console.log(`        ⚠️ Elemento do botão não encontrado ao tentar clicar`);
        }

        await page.waitForLoadState('networkidle').catch(() => { });
        await page.waitForTimeout(3000);

        // Verificação: até 6 checagens de 2 segundos para confirmar mudança de status
        for (let check = 1; check <= 6; check++) {
            status = await lerStatusConclusao(page);
            if (status.concluido) {
                console.log(`        ✅ CONFIRMADO: Status alterado com sucesso para CONCLUÍDO!`);
                return true;
            }
            await page.waitForTimeout(2000);
        }

        console.log(`        ⚠️ Status ainda não confirmou como concluído após tentativa ${tentativa}. Tentando novamente...`);
    }

    status = await lerStatusConclusao(page);
    if (status.concluido) {
        console.log(`        ✅ Tema confirmado como CONCLUÍDO!`);
        return true;
    } else {
        console.log(`        ⚠️ ALERTA: Não foi possível confirmar se o tema mudou de status para Concluído.`);
        return false;
    }
}

async function extrairConteudoDoIframe(page: Page, frame: any): Promise<{ conteudoCompleto: string; totalPaginas: number; encontrouErroServidor: boolean }> {
    let conteudoCompleto = '';
    let totalPaginas = 0;
    let temMaisPaginas = true;
    let paginaAtual = 1;
    let encontrouErroServidor = false;

    while (temMaisPaginas && paginaAtual <= 50) {
        console.log(`            📄 Página ${paginaAtual}...`);
        const conteudoPagina = await frame.evaluate(() => {
            document.querySelectorAll('script, style, noscript').forEach(el => el.remove());
            document.querySelectorAll('nav, aside, header, [role="navigation"], .sidebar').forEach(el => {
                (el as HTMLElement).style.display = 'none';
            });
            let melhorEl = null;
            for (const sel of [
                'main [class*="content"]',
                'main [class*="conteudo"]',
                'main article',
                '[class*="lesson-content"]',
                '[class*="aula-conteudo"]',
                '[class*="content-body"]',
                '[data-testid*="content"]',
                'main'
            ]) {
                const el = document.querySelector(sel);
                if (el && (el.textContent?.trim() || '').length > 0) {
                    melhorEl = el;
                    break;
                }
            }
            const alvo = melhorEl || document.body;
            const clone = alvo.cloneNode(true) as HTMLElement;
            clone.querySelectorAll('script, style, noscript').forEach((el: Element) => el.remove());
            return clone.innerHTML;
        });

        const textoLimpo = conteudoPagina.replace(/<[^>]*>/g, '').trim();
        if (textoLimpo.length > 50) {
            if (conteudoEhErro(textoLimpo)) {
                console.log(`              ❌ Conteúdo indica erro do servidor, parando extração deste item`);
                encontrouErroServidor = true;
                break;
            }
            conteudoCompleto += `\n\n--- PÁGINA ${paginaAtual} ---\n${conteudoPagina}`;
            console.log(`              ✅ Conteúdo extraído (${textoLimpo.length} chars)`);
        } else {
            console.log(`              ⚠️ Pouco ou nenhum conteúdo na página ${paginaAtual}`);
        }

        totalPaginas = paginaAtual;

        const temProximaPagina = await frame.evaluate(() => {
            const wrapperAvancar = document.querySelector('[data-element="button_avançar"]');
            const btnAvancar = wrapperAvancar?.querySelector('button');
            if (btnAvancar) {
                const disabled = btnAvancar.getAttribute('disabled');
                const ariaDisabled = btnAvancar.getAttribute('aria-disabled');
                if (disabled === null && ariaDisabled !== 'true') return 'avançar';
            }
            const wrapperAcessar = document.querySelector('[data-element="button_acessar-conteudo"]');
            const btnAcessar = wrapperAcessar?.querySelector('button');
            if (btnAcessar) {
                const disabled = btnAcessar.getAttribute('disabled');
                const ariaDisabled = btnAcessar.getAttribute('aria-disabled');
                if (disabled === null && ariaDisabled !== 'true') return 'acessar';
            }
            return null;
        });

        if (temProximaPagina) {
            const labelBtn = temProximaPagina === 'avançar' ? 'Avançar' : 'Acessar conteúdo';
            console.log(`              ➡️ Botão "${labelBtn}" encontrado, avançando para próxima página...`);
            const clicou = await frame.evaluate((tipo: string) => {
                const selector = tipo === 'avançar'
                    ? '[data-element="button_avançar"]'
                    : '[data-element="button_acessar-conteudo"]';
                const wrapper = document.querySelector(selector);
                const btn = wrapper?.querySelector('button');
                if (btn) {
                    const disabled = btn.getAttribute('disabled');
                    const ariaDisabled = btn.getAttribute('aria-disabled');
                    if (disabled === null && ariaDisabled !== 'true') {
                        btn.click();
                        return true;
                    }
                }
                return false;
            }, temProximaPagina);

            if (clicou) {
                console.log(`              🔄 Avançando para página ${paginaAtual + 1}...`);
                await frame.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
                await page.waitForTimeout(2000);
                paginaAtual++;
            } else {
                console.log(`              ℹ️ Botão encontrado mas desabilitado, fim do conteúdo`);
                temMaisPaginas = false;
            }
        } else {
            console.log(`              ℹ️ Nenhum botão de paginação encontrado, fim do conteúdo`);
            temMaisPaginas = false;
        }
    }

    return { conteudoCompleto, totalPaginas, encontrouErroServidor };
}

async function abrirDrawerTema(page: Page, temaId: string): Promise<boolean> {
    const jaAberto = await page.evaluate(() => {
        const drawer = document.querySelector('[data-testid="drawer-id"]');
        if (!drawer) return false;
        return drawer.getAttribute('aria-hidden') === 'false';
    });

    if (jaAberto) {
        return true;
    }

    const clicou = await page.evaluate((id: string) => {
        const btn = document.querySelector<HTMLElement>(`[data-testid="card-sucesso-botao"][data-info="${id}"]`);
        if (!btn) return false;
        btn.click();
        return true;
    }, temaId);

    if (!clicou) return false;

    try {
        await page.waitForFunction(() => {
            const drawer = document.querySelector('[data-testid="drawer-id"]');
            return drawer && drawer.getAttribute('aria-hidden') === 'false';
        }, { timeout: 10000 });
        await page.waitForTimeout(1500);
        return true;
    } catch {
        return false;
    }
}

async function detectarTipoConteudo(page: Page, titulo: string): Promise<{ ehVideo: boolean; temIframeTexto: boolean }> {
    const tituloLower = (titulo || '').toLowerCase();
    const tituloIndicaVideo = tituloLower.includes('video') || tituloLower.includes('vídeo') || tituloLower.includes('gravação') || tituloLower.includes('webinar');

    const temIframeTexto = await page.evaluate(() => {
        const iframe = document.querySelector('[data-testid="iframe-conteudos"]');
        return iframe !== null;
    });

    const temPlayerVideo = await page.evaluate(() => {
        const video = document.querySelector('video, iframe[src*="youtube"], iframe[src*="vimeo"], iframe[src*="kaltura"], iframe[src*="player"], [data-testid*="video"], [class*="video-player"]');
        return video !== null;
    });

    const ehVideo = temPlayerVideo || (tituloIndicaVideo && !temIframeTexto);
    return { ehVideo, temIframeTexto };
}

async function processarTemaMultiplosItens(page: Page, temaInfo: any, temas: any[]): Promise<void> {
    console.log(`      🗂️ Processando tema com múltiplos itens: "${temaInfo.titulo}" (${temaInfo.itens} itens)`);

    // Acesso inicial para listar os itens do drawer
    await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const abriuInicial = await abrirDrawerTema(page, temaInfo.temaId);
    if (!abriuInicial) {
        console.log(`      ⚠️ Não foi possível abrir o drawer para o tema "${temaInfo.titulo}"`);
        return;
    }

    const itensDrawer = await page.evaluate(() => {
        const cards = document.querySelectorAll('[data-testid="card-conteudo-drawer"]');
        const lista: { index: number; titulo: string; status: string; dataElement: string }[] = [];
        cards.forEach((card, index) => {
            const titEl = card.querySelector('[data-testid="titulo-conteudo-drawer"]');
            const titulo = titEl?.textContent?.trim() || `Item ${index + 1}`;
            const tagEl = card.querySelector('[data-testid="card-tag"]');
            const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
            const btnEl = card.querySelector('[data-testid="botao-card-conteudo-drawer"]');
            const dataElement = btnEl?.getAttribute('data-element') || '';
            lista.push({ index, titulo, status, dataElement });
        });
        return lista;
    });

    console.log(`      📋 Itens encontrados no drawer: ${itensDrawer.length}`);
    for (const item of itensDrawer) {
        console.log(`        - [${item.status || 'Pendente'}] ${item.titulo}`);
    }

    for (let i = 0; i < itensDrawer.length; i++) {
        const item = itensDrawer[i];
        if (!item) continue;
        console.log(`\n      ▶️ [Item ${i + 1}/${itensDrawer.length}] Processando: "${item.titulo}"`);

        // 1. Sempre garantir que estamos na listagem e que o tema foi clicado para abrir o drawer
        await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(2000);
        const abriu = await abrirDrawerTema(page, temaInfo.temaId);
        if (!abriu) {
            console.log(`      ⚠️ Não foi possível abrir o drawer para acessar o item ${i + 1} ("${item.titulo}")`);
            continue;
        }

        // 2. Checar status atualizado do item no drawer antes de entrar
        const statusItemAtual = await page.evaluate((idx: number) => {
            const cards = document.querySelectorAll('[data-testid="card-conteudo-drawer"]');
            const card = cards[idx];
            if (!card) return '';
            const tag = card.querySelector('[data-testid="card-tag"]');
            return tag?.getAttribute('aria-label') || tag?.textContent?.trim() || '';
        }, i);

        if (statusItemAtual.toLowerCase().includes('conclu')) {
            console.log(`        ✅ Item "${item.titulo}" já está CONCLUÍDO no drawer. Pulando.`);
            continue;
        }

        // 3. Clicar no botão do item no drawer
        console.log(`        🖱️ Clicando para acessar "${item.titulo}"...`);
        const clicouItem = await page.evaluate((idx: number) => {
            const cards = document.querySelectorAll('[data-testid="card-conteudo-drawer"]');
            const card = cards[idx];
            if (!card) return false;
            const btn = card.querySelector<HTMLElement>('[data-testid="botao-card-conteudo-drawer"]');
            if (btn) {
                btn.click();
                return true;
            }
            return false;
        }, i);

        if (!clicouItem) {
            console.log(`        ⚠️ Não foi possível clicar no botão do item "${item.titulo}"`);
            continue;
        }

        await page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => { });
        await page.waitForTimeout(3000);

        const urlItem = page.url();
        console.log(`        📍 Item em: ${urlItem}`);

        // 4. Identificação dinâmica do tipo de item (vídeo vs aula interativa/texto)
        const { ehVideo, temIframeTexto } = await detectarTipoConteudo(page, item.titulo);

        let conteudoItem = '';
        let totalPags = 0;

        if (temIframeTexto) {
            console.log(`        📄 Item "${item.titulo}" identificado como AULA INTERATIVA / TEXTO (iframe detectado). Extraindo páginas...`);
            const iframeEl = await page.$('[data-testid="iframe-conteudos"]');
            if (iframeEl) {
                const frame = await iframeEl.contentFrame();
                if (frame) {
                    await frame.waitForSelector('main', { timeout: 15000 }).catch(() => { });
                    await page.waitForTimeout(2000);
                    const resExtracao = await extrairConteudoDoIframe(page, frame);
                    conteudoItem = resExtracao.conteudoCompleto;
                    totalPags = resExtracao.totalPaginas;

                    if (conteudoItem.trim().length > 0) {
                        temas.push({
                            titulo: `${temaInfo.titulo} - ${item.titulo}`,
                            url: urlItem,
                            textoPreview: `Conteúdo extraído (${totalPags} páginas)`,
                            temaId: `${temaInfo.temaId}_item_${i + 1}`,
                            status: 'concluido',
                            conteudos: [{
                                titulo: `${temaInfo.titulo} - ${item.titulo}`,
                                url: urlItem,
                                tipo: 'iframe-content',
                                status: resExtracao.encontrouErroServidor ? 'erro-servidor' : '',
                                elemento: '',
                                ariaLabel: '',
                                conteudoExtraido: conteudoItem.trim(),
                                totalPaginas: totalPags
                            }]
                        });
                    }
                }
            }
        } else if (ehVideo) {
            console.log(`        🎥 Item "${item.titulo}" identificado automaticamente como VÍDEO / VIDEOAULA. Nenhum HTML textual para coletar.`);
            // Inicia o vídeo caso haja player na tela
            await page.evaluate(() => {
                const v = document.querySelector('video');
                if (v && v.paused) v.play().catch(() => { });
            }).catch(() => { });
        } else {
            console.log(`        ℹ️ Item "${item.titulo}" identificado como conteúdo geral.`);
        }

        // 5. Aguarda timer se houver, clica no botão e confirma mudança de status para concluído
        await esperarTimerEConcluir(page);

        // 6. Retorna para a listagem para fechar o ciclo do item
        console.log(`        ↩️ Concluído "${item.titulo}". Retornando para a listagem para o próximo item...`);
        await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => { });
        await page.waitForTimeout(2000);
    }

    // Retorna à lista e verifica o status final do card do tema
    await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => { });
    await page.waitForTimeout(2000);
    const statusFinalCard = await page.evaluate((temaId: string) => {
        const card = document.querySelector(`[data-testid="card-sucesso-botao"][data-info="${temaId}"]`)?.closest('[data-testid="card-sucesso"]');
        const tag = card?.querySelector('[data-testid="card-tag"]');
        return tag?.getAttribute('aria-label') || tag?.textContent?.trim() || '';
    }, temaInfo.temaId);
    console.log(`      🏁 Todos os itens de "${temaInfo.titulo}" finalizados! Status do card na listagem: ${statusFinalCard || 'Pendente'}`);
}

async function rolarParaCarregarTodosCards(page: Page) {
    await page.evaluate(() => {
        window.scrollBy(0, 1000);
        const elements = document.querySelectorAll('*');
        for (let i = 0; i < elements.length; i++) {
            const el = elements[i];
            if (el && el.scrollHeight > el.clientHeight) {
                el.scrollTop = el.scrollHeight;
            }
        }
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await page.waitForTimeout(500);
}

async function extrairConteudoDisciplina(page: Page, disciplina: any): Promise<any[]> {
    const temas: any[] = [];
    const MAX_TENTATIVAS = 2;
    try {
        const urlConteudos = `https://estudante.estacio.br/disciplinas/${disciplina.urlId}/conteudos`;
        console.log(`  🌐 Navegando diretamente para conteúdos: ${urlConteudos}`);
        await page.goto(urlConteudos, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(3000);
        await closeTaciaModal(page);

        try {
            await page.click('text="Conteudos"', { timeout: 3000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            console.log('    📑 Aba "Conteúdos" clicada');
        }
        catch { }

        await rolarParaCarregarTodosCards(page);

        const diagInicial = await page.evaluate(() => {
            const cards = document.querySelectorAll('[data-testid="card-sucesso"]');
            const btns = Array.from(document.querySelectorAll('button, a')).map(b => ({
                tag: b.tagName,
                text: (b.textContent || '').trim().substring(0, 30),
                aria: b.getAttribute('aria-label') || '',
                testId: b.getAttribute('data-testid') || '',
                element: b.getAttribute('data-element') || ''
            })).filter(b => b.text || b.aria || b.testId || b.element);
            const pagElements = Array.from(document.querySelectorAll('[class*="pagin" i], [data-testid*="pagin" i], [aria-label*="pagin" i], nav')).map(el => ({
                tag: el.tagName,
                class: el.className?.substring(0, 40),
                text: (el.textContent || '').trim().substring(0, 60)
            }));
            return { totalCards: cards.length, btns: btns.slice(0, 15), pagElements };
        });
        console.log(`  🔍 Diagnóstico na página de conteúdos: ${diagInicial.totalCards} cards visíveis`);
        if (diagInicial.pagElements.length > 0) {
            console.log(`  🔍 Elementos de paginação:`, JSON.stringify(diagInicial.pagElements));
        }

        await rolarParaCarregarTodosCards(page);

        let pagina = 1;
        let temMais = true;
        while (temMais) {
            console.log(`  📄 Página ${pagina} da lista de temas...`);
            const temasPagina = await page.evaluate(() => {
                const temas: any[] = [];
                // Busca direta por todos os botões de card no grid
                const botoes = document.querySelectorAll('[data-testid="card-sucesso-botao"]');
                botoes.forEach((btn) => {
                    try {
                        const card = btn.closest('[data-testid="card-sucesso"]') || btn.closest('[data-lift="lft-cardshape"]') || btn.parentElement;
                        const tituloEl = card?.querySelector('[data-testid="card-sucesso-titulo"]');
                        const titulo = tituloEl?.textContent?.trim() || '';
                        const subtituloEl = card?.querySelector('[data-testid="card-sucesso-subtitulo"]');
                        const subtitulo = subtituloEl?.textContent?.trim() || '';
                        const temaId = btn.getAttribute('data-info') || '';
                        const ariaLabel = btn.getAttribute('aria-label') || '';
                        const tagEl = card?.querySelector('[data-testid="card-tag"]');
                        const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
                        const itensMatch = subtitulo.match(/(\d+)\s*Itens?/i);
                        const itens = itensMatch && itensMatch[1] ? parseInt(itensMatch[1]) : 1;
                        if (titulo && temaId && !temas.some(t => t.temaId === temaId)) {
                            temas.push({
                                titulo: `${subtitulo} - ${titulo}`.trim(),
                                temaId,
                                status,
                                ariaLabel,
                                itens,
                                urlBase: window.location.href
                            });
                        }
                    } catch (e) { }
                });

                // Fallback
                if (temas.length === 0) {
                    const cardsTema = document.querySelectorAll('[data-testid="card-sucesso"]');
                    cardsTema.forEach((card) => {
                        const tituloEl = card.querySelector('[data-testid="card-sucesso-titulo"]');
                        const titulo = tituloEl?.textContent?.trim() || '';
                        const subtituloEl = card.querySelector('[data-testid="card-sucesso-subtitulo"]');
                        const subtitulo = subtituloEl?.textContent?.trim() || '';
                        const botaoAcessar = card.querySelector('[data-testid="card-sucesso-botao"]');
                        const temaId = botaoAcessar?.getAttribute('data-info') || '';
                        const ariaLabel = botaoAcessar?.getAttribute('aria-label') || '';
                        const tagEl = card.querySelector('[data-testid="card-tag"]');
                        const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
                        const itensMatch = subtitulo.match(/(\d+)\s*Itens?/i);
                        const itens = itensMatch && itensMatch[1] ? parseInt(itensMatch[1]) : 1;
                        if (titulo && temaId && !temas.some(t => t.temaId === temaId)) {
                            temas.push({
                                titulo: `${subtitulo} - ${titulo}`.trim(),
                                temaId,
                                status,
                                ariaLabel,
                                itens,
                                urlBase: window.location.href
                            });
                        }
                    });
                }
                return temas;
            });
            console.log(`    🔗 ${temasPagina.length} temas encontrados nesta página`);

            for (const temaInfo of temasPagina) {
                // 1. Verificar se o tema já está concluído
                if (temaInfo.status && temaInfo.status.toLowerCase().includes('conclu')) {
                    console.log(`      ✅ Tema "${temaInfo.titulo}" já está CONCLUÍDO na listagem. Pulando.`);
                    continue;
                }

                // 2. Tema com múltiplos itens (ex: Tema 8 | 2 Itens)
                if (temaInfo.itens > 1) {
                    await processarTemaMultiplosItens(page, temaInfo, temas);
                    continue;
                }

                // 3. Tema de item único normal
                let temasBemSucedidos = false;
                for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
                    if (temasBemSucedidos)
                        break;
                    try {
                        if (tentativa > 1) {
                            console.log(`      🔄 Tentativa ${tentativa}/${MAX_TENTATIVAS} para tema: ${temaInfo.titulo}`);
                        }
                        else {
                            console.log(`      📂 Acessando tema: ${temaInfo.titulo} (ID: ${temaInfo.temaId})`);
                        }
                        await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 });
                        await page.waitForTimeout(2000);

                        const clicouTema = await page.evaluate((temaId: string) => {
                            const btn = document.querySelector<HTMLElement>(`[data-testid="card-sucesso-botao"][data-info="${temaId}"]`);
                            if (!btn)
                                return false;
                            btn.click();
                            return true;
                        }, temaInfo.temaId);

                        if (!clicouTema) {
                            console.log(`        ⚠️ Botão do tema não encontrado`);
                            break;
                        }

                        await page.waitForLoadState('networkidle', { timeout: 30000 });
                        await page.waitForTimeout(3000);

                        // Salvaguarda: se abrir um drawer mesmo que itens não tenha sido parseado como > 1
                        const abriuDrawerInesperado = await page.evaluate(() => {
                            const drawer = document.querySelector('[data-testid="drawer-id"]');
                            return drawer && drawer.getAttribute('aria-hidden') === 'false';
                        });
                        if (abriuDrawerInesperado) {
                            console.log(`        ℹ️ Drawer de múltiplos itens detectado para "${temaInfo.titulo}". Redirecionando fluxo...`);
                            await processarTemaMultiplosItens(page, temaInfo, temas);
                            temasBemSucedidos = true;
                            break;
                        }

                        const urlTema = page.url();
                        console.log(`        📍 Tema em: ${urlTema}`);

                        let conteudoCompleto = '';
                        let totalPaginas = 0;
                        let encontrouErroServidor = false;

                        let iframe = null;
                        try {
                            iframe = await page.waitForSelector('[data-testid="iframe-conteudos"]', { timeout: 12000 });
                        } catch {
                            console.log(`        ℹ️ Nenhum iframe encontrado neste tema (pode ser aula em vídeo ou página direta).`);
                        }

                        if (iframe) {
                            console.log(`        📄 Extraindo conteúdo do iframe...`);
                            const frame = await iframe.contentFrame();
                            if (frame) {
                                await frame.waitForSelector('main', { timeout: 15000 }).catch(() => { });
                                await page.waitForTimeout(2000);

                                const res = await extrairConteudoDoIframe(page, frame);
                                conteudoCompleto = res.conteudoCompleto;
                                totalPaginas = res.totalPaginas;
                                encontrouErroServidor = res.encontrouErroServidor;
                            }
                        }

                        if (encontrouErroServidor && tentativa < MAX_TENTATIVAS) {
                            console.log(`        ⏳ Aguardando 5s antes de tentar novamente...`);
                            await page.waitForTimeout(5000);
                            continue;
                        }

                        const jaExiste = temas.some(t => t.temaId === temaInfo.temaId);
                        if (!jaExiste) {
                            temas.push({
                                titulo: temaInfo.titulo,
                                url: urlTema,
                                textoPreview: `Conteúdo extraído (${totalPaginas} páginas)`,
                                temaId: temaInfo.temaId,
                                status: temaInfo.status,
                                conteudos: [{
                                    titulo: temaInfo.titulo,
                                    url: urlTema,
                                    tipo: 'iframe-content',
                                    status: encontrouErroServidor ? 'erro-servidor' : '',
                                    elemento: '',
                                    ariaLabel: '',
                                    conteudoExtraido: conteudoCompleto.trim(),
                                    totalPaginas
                                }]
                            });
                        }
                        temasBemSucedidos = true;

                        // Aguarda timer e verifica a confirmação da mudança de status para Concluído
                        if (!encontrouErroServidor) {
                            await esperarTimerEConcluir(page);
                        }

                        // Retorna à lista para verificar o card
                        await page.goto(temaInfo.urlBase, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => { });
                        await page.waitForTimeout(2000);
                        const statusPosConclusao = await page.evaluate((temaId: string) => {
                            const card = document.querySelector(`[data-testid="card-sucesso-botao"][data-info="${temaId}"]`)?.closest('[data-testid="card-sucesso"]');
                            const tag = card?.querySelector('[data-testid="card-tag"]');
                            return tag?.getAttribute('aria-label') || tag?.textContent?.trim() || '';
                        }, temaInfo.temaId);
                        if (statusPosConclusao.toLowerCase().includes('conclu')) {
                            console.log(`        🎉 Card do tema "${temaInfo.titulo}" verificado na listagem: CONCLUÍDO!`);
                        }
                    }
                    catch (err) {
                        console.log(`        ⚠️ Erro ao processar tema ${temaInfo.titulo}: ${err}`);
                        if (tentativa < MAX_TENTATIVAS) {
                            console.log(`        ⏳ Aguardando 5s antes de tentar novamente...`);
                            await page.waitForTimeout(5000);
                        }
                    }
                }
            }

            const avancou = await avancarPagina(page);
            if (avancou) {
                pagina++;
            }
            else {
                temMais = false;
            }
        }
        console.log(`  ✅ Total de ${temas.length} temas únicos coletados para ${disciplina.nome}`);
    }
    catch (err) {
        console.log(`  ⚠️ Erro ao processar ${disciplina.nome}: ${err}`);
    }
    return temas;
}

async function avancarPagina(page: Page): Promise<boolean> {
    const seletoresProximo = [
        '[data-testid="pagination-next"]',
        '[data-testid="next-page"]',
        '[data-element="button_proxima-pagina"]',
        'button[aria-label*="próxima" i]',
        'button[aria-label*="proxima" i]',
        'button[aria-label*="avançar" i]',
        'button[aria-label*="avancar" i]',
        'button[aria-label*="next" i]',
        'button:has-text("Próxima")',
        'button:has-text("Próximo")',
        'a:has-text("Próxima")',
        'a:has-text("Próximo")'
    ];
    for (const sel of seletoresProximo) {
        const btn = page.locator(sel).first();
        if (await btn.isVisible().catch(() => false)) {
            const isDisabled = await btn.getAttribute('disabled').catch(() => null);
            const isAriaDisabled = await btn.getAttribute('aria-disabled').catch(() => null);
            if (!isDisabled && isAriaDisabled !== 'true') {
                console.log(`    ➡️ Avançando para próxima página via seletor: ${sel}`);
                await btn.click({ force: true }).catch(() => {});
                await page.waitForLoadState('networkidle').catch(() => {});
                await page.waitForTimeout(2500);
                return true;
            }
        }
    }
    const clicouNumero = await page.evaluate(() => {
        const paginationContainer = document.querySelector('[data-lift="lft-pagination"], [data-testid="pagination"], nav[aria-label*="pagin" i], ul[class*="pagination"]');
        if (paginationContainer) {
            const btns = Array.from(paginationContainer.querySelectorAll('button, a'));
            const btnAtivo = paginationContainer.querySelector('[aria-current="page"], [data-selected="true"], .active, [class*="active"]');
            const paginaAtual = btnAtivo ? parseInt(btnAtivo.textContent?.trim() || '1') : 1;
            const proximaPaginaBtn = btns.find(b => parseInt(b.textContent?.trim() || '') === paginaAtual + 1);
            if (proximaPaginaBtn && !(proximaPaginaBtn as HTMLButtonElement).disabled) {
                (proximaPaginaBtn as HTMLElement).click();
                return true;
            }
        }
        return false;
    });
    if (clicouNumero) {
        console.log(`    ➡️ Avançando para próxima página via botão numérico`);
        await page.waitForLoadState('networkidle').catch(() => {});
        await page.waitForTimeout(2500);
        return true;
    }
    return false;
}

async function navegarParaExercicios(page: Page, urlId: string): Promise<boolean> {
    const urlExercicios = `https://estudante.estacio.br/disciplinas/${urlId}/exercicios`;
    console.log(`  📝 Navegando para exercícios: ${urlExercicios}`);
    await page.goto(urlExercicios, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    const urlFinal = page.url();
    if (!urlFinal.includes('/exercicios')) {
        console.log(`  ⚠️ Não foi possível acessar exercícios. URL atual: ${urlFinal}`);
        return false;
    }
    console.log(`  ✅ Na página de exercícios: ${urlFinal}`);
    return true;
}

async function extrairListasExercicio(page: Page): Promise<any[]> {
    const listas: any[] = [];
    await rolarParaCarregarTodosCards(page);
    let temMais = true;
    let pagina = 1;
    while (temMais) {
        console.log(`  📄 Página ${pagina} da lista de exercícios...`);
        const listasPagina = await page.evaluate(() => {
            const resultado: any[] = [];
            const botoes = document.querySelectorAll('[data-testid="card-sucesso-botao"]');
            botoes.forEach((btn) => {
                try {
                    const card = btn.closest('[data-testid="card-sucesso"]') || btn.closest('[data-lift="lft-cardshape"]') || btn.parentElement;
                    const tituloEl = card?.querySelector('[data-testid="card-sucesso-titulo"]');
                    const titulo = tituloEl?.textContent?.trim() || '';
                    const subtituloEl = card?.querySelector('[data-testid="card-sucesso-subtitulo"]');
                    const tema = subtituloEl?.textContent?.trim() || '';
                    const listaId = btn.getAttribute('data-info') || '';
                    const tagEl = card?.querySelector('[data-testid="card-tag"]');
                    const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
                    if (titulo && listaId && !resultado.some(r => r.listaId === listaId)) {
                        resultado.push({ titulo, tema, listaId, status, questoes: [] });
                    }
                }
                catch (e) { }
            });
            if (resultado.length === 0) {
                const cards = document.querySelectorAll('[data-testid="card-sucesso"]');
                cards.forEach((card) => {
                    const tituloEl = card.querySelector('[data-testid="card-sucesso-titulo"]');
                    const titulo = tituloEl?.textContent?.trim() || '';
                    const subtituloEl = card.querySelector('[data-testid="card-sucesso-subtitulo"]');
                    const tema = subtituloEl?.textContent?.trim() || '';
                    const botaoAcessar = card.querySelector('[data-testid="card-sucesso-botao"]');
                    const listaId = botaoAcessar?.getAttribute('data-info') || '';
                    const tagEl = card.querySelector('[data-testid="card-tag"]');
                    const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
                    if (titulo && listaId && !resultado.some(r => r.listaId === listaId)) {
                        resultado.push({ titulo, tema, listaId, status, questoes: [] });
                    }
                });
            }
            return resultado;
        });
        console.log(`    🔗 ${listasPagina.length} lista(s) encontrada(s) nesta página`);
        for (const l of listasPagina) {
            if (!listas.some(item => item.listaId === l.listaId)) {
                listas.push(l);
            }
        }
        const avancou = await avancarPagina(page);
        if (avancou) {
            pagina++;
        } else {
            temMais = false;
        }
    }
    return listas;
}

async function clicarNaListaExercicio(page: Page, listaId: string, urlBase: string): Promise<boolean> {
    await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    const clicou = await page.evaluate((id: string) => {
        const btn = document.querySelector<HTMLElement>(`[data-testid="card-sucesso-botao"][data-info="${id}"]`);
        if (!btn)
            return false;
        btn.click();
        return true;
    }, listaId);
    if (clicou) {
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        await page.waitForTimeout(3000);
        return true;
    }
    return false;
}

async function extrairQuestoes(page: Page): Promise<any[]> {
    return await page.evaluate(() => {
        const questoes: any[] = [];
        const questionWrappers = document.querySelectorAll('[data-question-index]');
        questionWrappers.forEach((wrapper, index) => {
            const numero = index + 1;
            const questionContainer = wrapper.querySelector('[data-testid^="question-"]');
            if (!questionContainer)
                return;
            const typographyEls = questionContainer.querySelectorAll('[data-testid="question-typography"]');
            let enunciado = '';
            typographyEls.forEach(t => {
                const texto = t.textContent?.trim();
                if (texto)
                    enunciado += texto + '\n';
            });
            const alternativas: any[] = [];
            const altButtons = questionContainer.querySelectorAll('[data-testid^="alternative-"]');
            altButtons.forEach(btn => {
                const testId = btn.getAttribute('data-testid') || '';
                const hash = testId.replace('alternative-', '');
                const letraEl = btn.querySelector('[data-testid="circle-letter"]');
                const letra = letraEl?.textContent?.trim() || '';
                const textoEl = btn.querySelector('[data-testid="question-typography"]');
                const texto = textoEl?.textContent?.trim() || '';
                if (letra && texto) {
                    alternativas.push({ letra, texto, hash });
                }
            });
            if (enunciado) {
                questoes.push({ numero, enunciado: enunciado.trim(), alternativas });
            }
        });
        return questoes;
    });
}

async function parseTimeInfo(page: Page) {
    const timeText = await page.evaluate(() => {
        const spans = document.querySelectorAll('span[aria-hidden="true"]');
        for (const span of spans) {
            if (span.textContent?.includes('atualizada às')) {
                return span.textContent;
            }
        }
        return null;
    });
    const agora = new Date();
    let atualizacao = new Date(agora);
    let proximaAtualizacao = new Date(agora);
    if (timeText) {
        const atualizacaoMatch = timeText.match(/atualizada às (\d{1,2}):(\d{2})/);
        const proximaMatch = timeText.match(/próxima atualização às (\d{1,2}):(\d{2})/);
        if (atualizacaoMatch && atualizacaoMatch[1] && atualizacaoMatch[2]) {
            atualizacao = new Date(agora);
            atualizacao.setHours(parseInt(atualizacaoMatch[1]), parseInt(atualizacaoMatch[2]), 0, 0);
        }
        if (proximaMatch && proximaMatch[1] && proximaMatch[2]) {
            proximaAtualizacao = new Date(agora);
            proximaAtualizacao.setHours(parseInt(proximaMatch[1]), parseInt(proximaMatch[2]), 0, 0);
            if (proximaAtualizacao <= atualizacao) {
                proximaAtualizacao.setDate(proximaAtualizacao.getDate() + 1);
            }
        }
    }
    const tempoRestanteMs = proximaAtualizacao.getTime() - agora.getTime();
    return { atualizacao, proximaAtualizacao, tempoRestanteMs };
}

async function salvarExerciciosJSON(listas: any[], nomeArquivo: string) {
    const dir = RESUMOS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const caminho = path.join(dir, nomeArquivo);
    fs.writeFileSync(caminho, JSON.stringify(listas, null, 2));
    console.log(`  💾 Exercícios salvos em: ${caminho}`);
}

async function salvarConteudosMD(temas: any[], nomeArquivo: string) {
    const dir = RESUMOS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const caminho = path.join(dir, `${nomeArquivo}-conteudos.md`);
    const caminhoPrincipal = path.join(dir, `${nomeArquivo}.MD`);
    let md = '';
    temas.forEach((tema, i) => {
        md += `# ${i + 1}. ${tema.titulo}\n\n`;
        if (tema.conteudos && tema.conteudos.length > 0) {
            tema.conteudos.forEach((c: any) => {
                md += `## ${c.titulo}\n\n`;
                md += `${c.conteudoExtraido}\n\n`;
            });
        }
    });
    fs.writeFileSync(caminho, md);
    fs.writeFileSync(caminhoPrincipal, md);
    console.log(`  💾 Conteúdos salvos em: ${caminho} e ${caminhoPrincipal}`);
}

async function aguardarArquivoRespostas(page: Page, respostasPath: string, timeoutMinutos: number = 20): Promise<Record<string, Record<number, string>> | null> {
    const inicio = Date.now();
    const timeoutMs = timeoutMinutos * 60 * 1000;
    console.log(`\n======================================================`);
    console.log(`⏳ AGUARDANDO RESPOSTAS DO ASSISTENTE / IA`);
    console.log(`📁 Arquivo esperado: ${respostasPath}`);
    console.log(`⏱️ Tempo limite: ${timeoutMinutos} minutos`);
    console.log(`💡 O assistente pode gerar o JSON diretamente neste caminho`);
    console.log(`======================================================\n`);

    let ultimoAviso = 0;
    while (Date.now() - inicio < timeoutMs) {
        if (fs.existsSync(respostasPath)) {
            try {
                const conteudo = fs.readFileSync(respostasPath, 'utf-8').trim();
                if (conteudo) {
                    const parsed = JSON.parse(conteudo);
                    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                        console.log(`\n🎉 Respostas encontradas em ${respostasPath}!`);
                        return parsed as Record<string, Record<number, string>>;
                    }
                }
            } catch {
                // Arquivo pode estar sendo escrito no momento, aguarda próxima iteração
            }
        }

        const decorridoSegundos = Math.floor((Date.now() - inicio) / 1000);
        if (decorridoSegundos - ultimoAviso >= 15) {
            ultimoAviso = decorridoSegundos;
            const restanteMin = Math.ceil((timeoutMs - (Date.now() - inicio)) / 60000);
            console.log(`⏳ Aguardando criação de ${path.basename(respostasPath)}... (${decorridoSegundos}s decorridos, restante ~${restanteMin}m)`);
        }

        await page.waitForTimeout(2000);
    }

    console.log(`❌ Tempo limite de ${timeoutMinutos}m excedido aguardando o arquivo de respostas.`);
    return null;
}

async function salvarRespostasJSON(respostas: unknown, nomeArquivo: string) {
    const dir = RESUMOS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const caminho = path.join(dir, `${nomeArquivo}-respostas.json`);
    fs.writeFileSync(caminho, JSON.stringify(respostas, null, 2));
    console.log(`  💾 Respostas salvas em: ${caminho}`);
}

function nomeArquivoDisciplina(nome: string): string {
    return nome.replace(/[\\/:*?"<>|]/g, '-');
}

async function processarExerciciosBatch(page: Page, disciplina: any): Promise<any[]> {
    const listasComQuestoes: any[] = [];
    const urlBase = page.url();
    const listas = await extrairListasExercicio(page);
    console.log(`  📋 ${listas.length} listas de exercícios encontradas`);
    for (const lista of listas) {
        if (lista.status && lista.status.toLowerCase().includes('conclu')) {
            console.log(`  ⏭️ Lista "${lista.tema} - ${lista.titulo}" já está CONCLUÍDA. Pulando.`);
            continue;
        }
        console.log(`  📝 Extraindo questões: ${lista.tema} - ${lista.titulo}`);
        try {
            const clicou = await clicarNaListaExercicio(page, lista.listaId, urlBase);
            if (!clicou) {
                console.log(`    ⚠️ Não foi possível acessar a lista`);
                continue;
            }
            try {
                await page.waitForSelector('[data-question-index]', { timeout: 10000 });
            }
            catch {
                console.log(`    ⚠️ Questões não carregaram para: ${lista.tema}`);
                await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(2000);
                continue;
            }
            const questoes = await extrairQuestoes(page);
            lista.questoes = questoes;
            console.log(`    ✅ ${questoes.length} questões extraídas`);
            listasComQuestoes.push(lista);
            await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(2000);
        }
        catch (err) {
            console.log(`    ⚠️ Erro ao extrair lista ${lista.titulo}: ${err}`);
        }
    }
    return listasComQuestoes;
}

async function processarExerciciosTemaPorTema(page: Page, disciplina: any): Promise<any[]> {
    const listasComQuestoes: any[] = [];
    const urlBase = page.url();
    const listas = await extrairListasExercicio(page);
    console.log(`  📋 ${listas.length} listas de exercícios encontradas`);
    for (const lista of listas) {
        if (lista.status && lista.status.toLowerCase().includes('conclu')) {
            console.log(`  ⏭️ Lista "${lista.tema} - ${lista.titulo}" já está CONCLUÍDA. Pulando.`);
            continue;
        }
        const timeInfo = await parseTimeInfo(page);
        const minutosRestantes = Math.floor(timeInfo.tempoRestanteMs / 60000);
        console.log(`  ⏰ Tempo restante: ${minutosRestantes} minutos`);
        if (minutosRestantes < 2) {
            console.log(`  ⏳ Pouco tempo restante, parando processamento`);
            break;
        }
        console.log(`  📝 Processando: ${lista.tema} - ${lista.titulo}`);
        try {
            const clicou = await clicarNaListaExercicio(page, lista.listaId, urlBase);
            if (!clicou) {
                console.log(`    ⚠️ Não foi possível acessar a lista`);
                continue;
            }
            try {
                await page.waitForSelector('[data-question-index]', { timeout: 10000 });
            }
            catch {
                console.log(`    ⚠️ Questões não carregaram para: ${lista.tema}`);
                await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
                await page.waitForTimeout(2000);
                continue;
            }
            const questoes = await extrairQuestoes(page);
            lista.questoes = questoes;
            console.log(`    ✅ ${questoes.length} questões extraídas`);
            listasComQuestoes.push(lista);
            await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(2000);
        }
        catch (err) {
            console.log(`    ⚠️ Erro ao processar lista ${lista.titulo}: ${err}`);
        }
    }
    return listasComQuestoes;
}

async function processarExercicios(page: Page, disciplina: any): Promise<any[]> {
    const navegou = await navegarParaExercicios(page, disciplina.urlId);
    if (!navegou) {
        console.log('  ⚠️ Não foi possível navegar para exercícios');
        return [];
    }
    const timeInfo = await parseTimeInfo(page);
    const minutosRestantes = Math.floor(timeInfo.tempoRestanteMs / 60000);
    console.log(`  ⏰ Última atualização: ${timeInfo.atualizacao.toLocaleTimeString('pt-BR')}`);
    console.log(`  ⏰ Próxima atualização: ${timeInfo.proximaAtualizacao.toLocaleTimeString('pt-BR')}`);
    console.log(`  ⏰ Tempo restante: ${minutosRestantes} minutos`);
    const TEMPO_MINIMO_BATCH_MS = 15 * 60 * 1000;
    const TEMPO_MINIMO_TEMA_MS = 5 * 60 * 1000;
    if (timeInfo.tempoRestanteMs > TEMPO_MINIMO_BATCH_MS) {
        console.log('  ✅ Tempo suficiente para processar em batch');
        return await processarExerciciosBatch(page, disciplina);
    }
    else if (timeInfo.tempoRestanteMs > TEMPO_MINIMO_TEMA_MS) {
        console.log('  ⚠️ Processando tema por tema (tempo limitado)');
        return await processarExerciciosTemaPorTema(page, disciplina);
    }
    else {
        console.log('  ⏳ Pouco tempo restante, aguardando próxima atualização...');
        const esperaMs = timeInfo.tempoRestanteMs + 60000;
        const esperaMin = Math.floor(esperaMs / 60000);
        console.log(`  ⏳ Aguardando ${esperaMin} minutos...`);
        await page.waitForTimeout(esperaMs);
        return await processarExercicios(page, disciplina);
    }
}

function formatarDisciplina(disc: any, temas: any[]) {
    let out = `═══════════════════════════════════\n`;
    out += `📖 ${disc.nome} (${disc.progressoConteudo}, ${disc.porcentagem}%)\n`;
    out += `═══════════════════════════════════\n`;
    if (temas.length === 0) {
        return out + `   (Nenhum tema encontrado)\n\n`;
    }
    temas.forEach((tema, i) => {
        out += `  ${i + 1}. ${tema.titulo}\n`;
        out += `     🔗 ${tema.url}\n`;
        out += `     📝 ${tema.textoPreview}\n`;
        if (tema.conteudos && tema.conteudos.length > 0) {
            out += `     📚 ${tema.conteudos.length} conteúdos:\n`;
            tema.conteudos.forEach((c: any, j: number) => {
                out += `       ${j + 1}. ${c.titulo} (${c.status})`;
                if (c.totalPaginas)
                    out += ` - ${c.totalPaginas} página(s)`;
                out += `\n`;
            });
        }
        out += `\n`;
    });
    return out;
}

export function carregarRespostasJSON(caminho: string) {
    try {
        if (!fs.existsSync(caminho)) {
            console.log(`  ⚠️ Arquivo de respostas não encontrado: ${caminho}`);
            return null;
        }
        const conteudo = fs.readFileSync(caminho, 'utf-8');
        const respostas = JSON.parse(conteudo);
        console.log(`  ✅ Respostas carregadas de: ${caminho}`);
        return respostas;
    }
    catch (err) {
        console.log(`  ❌ Erro ao carregar respostas: ${err}`);
        return null;
    }
}

export async function enviarRespostasExercicios(page: Page, disciplina: any, respostas: Record<string, Record<number, string>>) {
    const navegou = await navegarParaExercicios(page, disciplina.urlId);
    if (!navegou) {
        console.log('  ⚠️ Não foi possível navegar para exercícios');
        return;
    }
    const listas = await extrairListasExercicio(page);
    const urlBase = page.url();
    for (const lista of listas) {
        if (lista.status && lista.status.toLowerCase().includes('conclu')) {
            console.log(`  ⏭️ Exercício "${lista.tema} - ${lista.titulo}" já está CONCLUÍDO. Pulando envio.`);
            continue;
        }
        const respostasLista = respostas[lista.listaId];
        if (!respostasLista) {
            console.log(`  ⚠️ Sem respostas para: ${lista.tema} - ${lista.titulo}`);
            continue;
        }
        console.log(`  📝 Enviando respostas: ${lista.tema} - ${lista.titulo}`);
        try {
            const clicou = await clicarNaListaExercicio(page, lista.listaId, urlBase);
            if (!clicou) {
                console.log(`    ⚠️ Não foi possível acessar a lista`);
                continue;
            }
            try {
                await page.waitForSelector('[data-question-index]', { timeout: 15000 });
            }
            catch {
                console.log(`    ⚠️ Questões não carregaram para: ${lista.tema}`);
                continue;
            }
            const questoesLive = await extrairQuestoes(page);
            for (const [numeroStr, letra] of Object.entries(respostasLista)) {
                const numero = parseInt(numeroStr);
                const questao = questoesLive.find(q => q.numero === numero);
                if (!questao) {
                    console.log(`    ⚠️ Questão ${numero} não encontrada (${questoesLive.length} questões na página)`);
                    continue;
                }
                const alternativa = questao.alternativas.find((a: any) => a.letra === letra);
                if (!alternativa) {
                    console.log(`    ⚠️ Alternativa ${letra} não encontrada na questão ${numero}`);
                    continue;
                }
                const selecionou = await page.evaluate((hash: string) => {
                    const btn = document.querySelector<HTMLElement>(`[data-testid="alternative-${hash}"]`);
                    if (btn) {
                        btn.click();
                        return true;
                    }
                    return false;
                }, alternativa.hash);
                if (selecionou) {
                    console.log(`    ✅ Q${numero}: ${letra}) ${alternativa.texto.substring(0, 30)}...`);
                }
                else {
                    console.log(`    ❌ Falha ao selecionar Q${numero}: ${letra}`);
                }
                await page.waitForTimeout(2000);
            }
            const finalizou = await page.evaluate(() => {
                const seletores = [
                    '[data-element="button_finalizar-prova"]',
                    '[data-element*="finalizar"]',
                    '[data-testid*="finalizar"]',
                    '[data-testid="botao-finalizar"]',
                    '[data-element*="entregar"]',
                    '[data-testid*="entregar"]'
                ];
                for (const sel of seletores) {
                    const btn = document.querySelector<HTMLButtonElement>(sel);
                    if (btn && !btn.disabled) {
                        btn.scrollIntoView();
                        btn.click();
                        return true;
                    }
                }
                const botoes = Array.from(document.querySelectorAll('button'));
                const btnTexto = botoes.find(b => {
                    const txt = (b.textContent || '').trim().toLowerCase();
                    return (txt.includes('finalizar') || txt.includes('entregar') || txt.includes('enviar respostas')) && !b.disabled;
                });
                if (btnTexto) {
                    btnTexto.scrollIntoView();
                    btnTexto.click();
                    return true;
                }
                return false;
            });
            if (finalizou) {
                try {
                    await page.waitForTimeout(1500);
                    const confirmou = await page.evaluate(() => {
                        const btnModal = document.querySelector<HTMLElement>('[data-testid="submit-button"], button[data-element*="confirmar"], button[data-testid*="confirmar"]');
                        if (btnModal) {
                            btnModal.click();
                            return true;
                        }
                        const botoes = Array.from(document.querySelectorAll('button, [role="button"]'));
                        const btnSim = botoes.find(b => {
                            const txt = (b.textContent || '').trim().toLowerCase();
                            return (txt === 'sim' || txt.includes('confirmar') || txt.includes('finalizar')) && !((b as any).disabled);
                        });
                        if (btnSim) {
                            (btnSim as HTMLElement).click();
                            return true;
                        }
                        return false;
                    });
                    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => { });
                    await page.waitForTimeout(4000);
                    console.log(`    ✅ Exercício finalizado (confirmado: ${confirmou})`);
                }
                catch {
                    console.log(`    ⚠️ Modal de confirmação não apareceu ou exercício já foi finalizado`);
                }
            }
            else {
                const botoesDiag = await page.evaluate(() => {
                    return Array.from(document.querySelectorAll('button, [role="button"], a')).map(b => ({
                        texto: (b.textContent || '').trim().substring(0, 30),
                        element: b.getAttribute('data-element') || '',
                        testId: b.getAttribute('data-testid') || '',
                        aria: b.getAttribute('aria-label') || '',
                        disabled: (b as HTMLButtonElement).disabled
                    })).filter(b => b.texto || b.element || b.testId || b.aria);
                });
                console.log(`    ⚠️ Botão "Finalizar" não encontrado. Botões visíveis na página:`, JSON.stringify(botoesDiag.slice(0, 10)));
            }
            await page.goto(urlBase, { waitUntil: 'networkidle', timeout: 15000 });
            await page.waitForTimeout(2000);
        }
        catch (err) {
            console.log(`    ⚠️ Erro ao enviar respostas para ${lista.titulo}: ${err}`);
        }
    }
}

async function salvarPedidoAjuda(listas: any[], nomeArquivo: string, erro: string) {
    const dir = RESUMOS_DIR;
    fs.mkdirSync(dir, { recursive: true });
    const pedido = {
        disciplina: nomeArquivo,
        listaId: listas[0]?.listaId || '',
        tema: listas[0]?.tema || '',
        instrucoes: 'Analise as questões abaixo e retorne JSON com respostas',
        formatoResposta: '{ "47262": { "1": "C", "9": "E" } }',
        questoes: listas.flatMap(l => l.questoes.map((q: any) => ({ numero: q.numero, enunciado: q.enunciado, alternativas: q.alternativas }))),
        erro
    };
    const pedidoPath = path.join(dir, 'preciso-ajuda.json');
    fs.writeFileSync(pedidoPath, JSON.stringify(pedido, null, 2));
    console.log(`  🆘 Pedido de ajuda salvo: ${pedidoPath}`);
    console.log('  📢 Hermes pode intervir e gerar as respostas manualmente');

    return pedidoPath;
}

export async function loginAndScrape(user: string, pass: string): Promise<string> {
    const browser = await chromium.launch({
        channel: 'msedge',
        headless: false,
        args: [
            '--start-maximized',
            '--window-position=0,0'
        ]
    });
    const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 }
    });
    const page: Page = await context.newPage();
    await page.bringToFront();

    try {
        console.log('🌐 Navegando para o portal...');
        await page.goto('https://estudante.estacio.br/login', { waitUntil: 'networkidle' });

        console.log('🔐 Iniciando login Microsoft SSO...');
        await loginMicrosoft(page, user, pass);

        console.log('⏳ Aguardando redirecionamento pós-login...');
        await page.waitForURL(url => !url.toString().includes('login.microsoftonline.com'), { timeout: 60000 });
        await page.waitForLoadState('networkidle');

        console.log('📚 Navegando para Minhas Disciplinas...');
        await navegarParaDisciplinas(page);

        console.log('Fechando modal da tácia')
        await closeTaciaModal(page)

        console.log('📖 Extraindo disciplinas...');
        const disciplinas = await extrairDisciplinas(page);

        if (disciplinas.length === 0) {
            return 'Nenhuma disciplina encontrada.';
        }

        const disciplinasPendentes = disciplinas.filter(d => !d.completa);
        console.log(`📋 ${disciplinas.length} disciplinas no total, ${disciplinasPendentes.length} pendentes (não completas)`);

        if (disciplinasPendentes.length === 0) {
            return 'Todas as disciplinas já estão completas!';
        }

        // Processar apenas a primeira disciplina pendente
        const disciplina = disciplinasPendentes[0]!;
        console.log(`🔍 Processando disciplina: ${disciplina.nome} (${disciplina.progressoConteudo}, ${disciplina.porcentagem}%)`);

        console.log('🔗 Extraindo URL ID da disciplina...');
        const urlId = await extrairUrlId(page, disciplina);
        if (!urlId) {
            console.log(`⚠️ Não foi possível obter URL ID para: ${disciplina.nome}.`);
            return `Não foi possível obter URL ID para: ${disciplina.nome}.`;
        }

        disciplina.urlId = urlId;

        // Extrair conteúdo
        const temas = await extrairConteudoDisciplina(page, disciplina);
        if (temas.length > 0) {
            await salvarConteudosMD(temas, nomeArquivoDisciplina(disciplina.nome));
        }

        // Extrair e processar exercícios
        const listasComQuestoes = await processarExercicios(page, disciplina);
        await salvarExerciciosJSON(listasComQuestoes, `${nomeArquivoDisciplina(disciplina.nome)}-exercicios.json`);

        if (listasComQuestoes.length > 0) {
            const respostasPath = path.join(RESUMOS_DIR, `${nomeArquivoDisciplina(disciplina.nome)}-respostas.json`);
            let respostas: Record<string, Record<number, string>> | null = null;
            if (fs.existsSync(respostasPath)) {
                try {
                    const conteudo = fs.readFileSync(respostasPath, 'utf-8').trim();
                    if (conteudo) {
                        respostas = JSON.parse(conteudo);
                        console.log(`  🎉 Respostas existentes encontradas em: ${respostasPath}!`);
                    }
                } catch { }
            }

            if (!respostas) {
                console.log('🤖 Aguardando análise dos exercícios pelo assistente...');
                respostas = await aguardarArquivoRespostas(page, respostasPath, 20);
            }

            if (respostas) {
                await enviarRespostasExercicios(page, disciplina, respostas);
            }
            else {
                await salvarPedidoAjuda(listasComQuestoes, disciplina.nome, 'Arquivo de respostas não foi gerado a tempo');
            }
        }

        console.log(`✅ Disciplina ${disciplina.nome} concluída!`);
        return `Disciplina ${disciplina.nome} processada com sucesso!`;

    } catch (error) {
        console.error('❌ Erro no scraping:', error);
        throw new Error(`Falha ao acessar ou extrair dados do portal: ${error}`);
    } finally {
        await browser.close();
    }
}