import { chromium } from 'playwright';
import type { Page } from 'playwright';

import fs from 'fs';
import path from 'path';
import { config } from 'dotenv';
import { chamarLLM, extrairJSON } from '../utils/nvidiaLLM.js';
config();

const RESUMOS_DIR = path.join(import.meta.dirname, '..', '..', 'resumos', 'firstPeriod', 'raw');

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
            data.push({
                testId: card.getAttribute('data-testid') || '',
                titulo: card.querySelector('h2')?.textContent?.trim() || '',
                widgetConteudo: card.querySelector('[data-testid="widget-progresso-conteudo"] small')?.textContent?.trim() || '0/0',
                widgetExercicio: card.querySelector('[data-testid="widget-progresso-exercicio"] small')?.textContent?.trim() || '0/0',
                widgetSimulado: card.querySelector('[data-testid="widget-progresso-simulado"] small')?.textContent?.trim() || '0/0',
                valor: card.querySelector('[data-testid="barra-progresso-disciplina"] progress')?.getAttribute('value') || '0',
                botaoAcessar: !!card.querySelector('[data-testid="botao-acessar-disciplina"]')
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
    const sectionModal = page.locator('section[data-testid="chat-drawer"]');

    // isVisible() retorna boolean (true/false) e não quebra o teste se não existir
    if (await sectionModal.isVisible()) {
        await page.locator('button[data-testid="minimize-button"]').click();
    }

    return;
}

async function extrairUrlId(page: Page, disciplina: any): Promise<string> {
    const cardSeletor = `[data-testid="card-disciplina-v2-${disciplina.codigo}"]`;
    const botaoSeletor = `${cardSeletor} [data-testid="botao-acessar-disciplina"]`;
    try {
        await page.waitForSelector(botaoSeletor, { timeout: 10000 });
    }
    catch {
        console.log(`  ⚠️ Botão de acesso não encontrado para ${disciplina.nome}`);
        return '';
    }
    await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 }).catch(() => { }),
        page.click(botaoSeletor),
    ]);
    await page.waitForTimeout(3000);
    const urlAtual = page.url();
    console.log(`  🌐 URL após clicar Acessar: ${urlAtual}`);
    const match = urlAtual.match(/disciplinas\/([^/]+)/);
    const urlId = match && match[1] ? match[1] : '';
    console.log(`  🔗 URL ID extraído: ${urlId}`);
    await page.goBack({ waitUntil: 'networkidle' });
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

async function extrairConteudoDisciplina(page: Page, disciplina: any): Promise<any[]> {
    const temas: any[] = [];
    const MAX_TENTATIVAS = 2;
    try {
        await page.goto('https://estudante.estacio.br/disciplinas', { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(3000);
        try {
            const chatWidget = await page.$('[data-testid="section-chat-assistente-pessoal"]');
            if (chatWidget) {
                await page.evaluate(() => {
                    const chat = document.querySelector('[data-testid="section-chat-assistente-pessoal"]');
                    if (chat)
                        chat.remove();
                });
                console.log('    💬 Chat widget removido do DOM');
            }
        } catch { }
        console.log(`  🔘 Clicando no botão de acesso da disciplina: ${disciplina.nome}`);

        const cardSeletor = `[data-testid="card-disciplina-v2-${disciplina.codigo}"]`;
        await page.waitForSelector(cardSeletor, { timeout: 10000 });

        const botaoAcessar = await page.$(`${cardSeletor} [data-testid="botao-acessar-disciplina"]`);
        if (!botaoAcessar) {
            console.log(`    ⚠️ Botão de acesso não encontrado para ${disciplina.nome}`);
            return [];
        }

        await botaoAcessar.click({ force: true });
        await page.waitForLoadState('networkidle', { timeout: 20000 });
        await page.waitForTimeout(3000);

        const urlAtual = page.url();
        console.log(`    📍 Redirecionado para: ${urlAtual}`);

        try {
            await page.click('text="Conteudos"', { timeout: 3000 });
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(2000);
            console.log('    📑 Aba "Conteúdos" clicada');
        }
        catch { }

        let pagina = 1;
        let temMais = true;
        while (temMais) {
            console.log(`  📄 Página ${pagina} da lista de temas...`);
            const temasPagina = await page.evaluate(() => {
                const temas: any[] = [];
                const cardsTema = document.querySelectorAll('[data-testid="card-sucesso"]');
                cardsTema.forEach((card) => {
                    try {
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
                        if (titulo && temaId) {
                            temas.push({
                                titulo: `${subtitulo} - ${titulo}`.trim(),
                                temaId,
                                status,
                                ariaLabel,
                                itens,
                                urlBase: window.location.href
                            });
                        }
                    }
                    catch (e) { }
                });
                return temas;
            });
            console.log(`    🔗 ${temasPagina.length} temas encontrados nesta página`);
            for (const temaInfo of temasPagina) {
                if (temaInfo.itens > 1) {
                    console.log(`      ⏭️ Pulando tema "${temaInfo.titulo}" (contém ${temaInfo.itens} itens)`);
                    continue;
                }
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
                        const urlTema = page.url();
                        console.log(`        📍 Tema em: ${urlTema}`);
                        console.log(`        ⏳ Aguardando iframe do tema...`);
                        const iframe = await page.waitForSelector('[data-testid="iframe-conteudos"]', { timeout: 15000 });
                        await page.waitForTimeout(2000);
                        console.log(`        📄 Extraindo conteúdo do iframe...`);
                        const frame = await iframe.contentFrame();
                        if (!frame) {
                            console.log(`        ⚠️ Não foi possível acessar frame do iframe`);
                            break;
                        }
                        await frame.waitForSelector('main', { timeout: 15000 }).catch(() => { });
                        await page.waitForTimeout(2000);
                        let conteudoCompleto = '';
                        let totalPaginas = 0;
                        let temMaisPaginas = true;
                        let paginaAtual = 1;
                        let encontrouErroServidor = false;
                        while (temMaisPaginas && paginaAtual <= 50) {
                            console.log(`            📄 Página ${paginaAtual} do tema...`);
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
                                    console.log(`              ❌ Conteúdo indica erro do servidor, parando extração deste tema`);
                                    encontrouErroServidor = true;
                                    break;
                                }
                                conteudoCompleto += `\n\n--- PÁGINA ${paginaAtual} ---\n${conteudoPagina}`;
                                console.log(`              ✅ Conteúdo extraído (${textoLimpo.length} chars)`);
                            }
                            else {
                                console.log(`              ⚠️ Pouco ou nenhum conteúdo na página ${paginaAtual}`);
                            }
                            totalPaginas = paginaAtual;
                            const temProximaPagina = await frame.evaluate(() => {
                                const wrapperAvancar = document.querySelector('[data-element="button_avançar"]');
                                const btnAvancar = wrapperAvancar?.querySelector('button');
                                if (btnAvancar) {
                                    const disabled = btnAvancar.getAttribute('disabled');
                                    const ariaDisabled = btnAvancar.getAttribute('aria-disabled');
                                    if (disabled === null && ariaDisabled !== 'true')
                                        return 'avançar';
                                }
                                const wrapperAcessar = document.querySelector('[data-element="button_acessar-conteudo"]');
                                const btnAcessar = wrapperAcessar?.querySelector('button');
                                if (btnAcessar) {
                                    const disabled = btnAcessar.getAttribute('disabled');
                                    const ariaDisabled = btnAcessar.getAttribute('aria-disabled');
                                    if (disabled === null && ariaDisabled !== 'true')
                                        return 'acessar';
                                }
                                return null;
                            });
                            if (temProximaPagina) {
                                const labelBtn = temProximaPagina === 'avançar' ? 'Avançar' : 'Acessar conteúdo';
                                console.log(`              ➡️ Botão "${labelBtn}" encontrado, acessando próxima página...`);
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
                                }
                                else {
                                    console.log(`              ℹ️ Botão encontrado mas desabilitado, fim do tema`);
                                    temMaisPaginas = false;
                                }
                            }
                            else {
                                console.log(`              ℹ️ Nenhum botão de paginação encontrado, fim do tema`);
                                temMaisPaginas = false;
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
                        if (!encontrouErroServidor) {
                            await esperarTimerEConcluir(page);
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
            const proximoBtn = await page.$('button:has-text("Próxima"), button:has-text("Próximo"), a:has-text("Próxima"), [aria-label*="next" i]');
            if (proximoBtn) {
                const isDisabled = await proximoBtn.getAttribute('disabled');
                const ariaDisabled = await proximoBtn.getAttribute('aria-disabled');
                if (!isDisabled && ariaDisabled !== 'true') {
                    await proximoBtn.click();
                    await page.waitForLoadState('networkidle');
                    await page.waitForTimeout(2000);
                    pagina++;
                }
                else {
                    temMais = false;
                }
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

const TEMPO_MINIMO_SEGUNDOS = 15 * 60;
const BUFFER_EXTRAS_SEGUNDOS = 10;

async function lerTimerGasto(page: Page): Promise<number | null> {
    return page.evaluate(() => {
        const header = document.querySelector('[data-testid="header-modal-conteudo"]');
        if (!header)
            return null;
        const tagConcluido = header.querySelector('[data-testid="tag-concluido"]');
        if (tagConcluido)
            return -1;
        const btn = header.querySelector('[data-element="button_marcar-como-concluido"]');
        if (!btn)
            return null;
        const text = btn.textContent || '';
        const match = text.match(/(\d{2}):(\d{2})/);
        if (match) {
            return parseInt(match[1] ?? '0') * 60 + parseInt(match[2] ?? '0');
        }
        return null;
    });
}

async function esperarTimerEConcluir(page: Page) {
    const gasto = await lerTimerGasto(page);
    if (gasto === -1) {
        console.log(`        ✅ Tema já concluído anteriormente`);
        return;
    }
    if (gasto === null) {
        console.log(`        ⚠️ Timer não encontrado, pulando concluir`);
        return;
    }
    const restante = TEMPO_MINIMO_SEGUNDOS - gasto + BUFFER_EXTRAS_SEGUNDOS;
    if (restante <= 0) {
        console.log(`        ⏰ Timer já passou de 15min, clicando "Concluir"...`);
    }
    else {
        const min = Math.floor(restante / 60);
        const seg = restante % 60;
        const gastoMin = Math.floor(gasto / 60);
        const gastoSeg = gasto % 60;
        console.log(`        ⏳ Timer: ${gastoMin}:${String(gastoSeg).padStart(2, '0')} → falta ${min}:${String(seg).padStart(2, '0')}`);
        await page.waitForTimeout(restante * 1000);
    }
    const clicou = await page.evaluate(() => {
        const btn = document.querySelector<HTMLButtonElement>('[data-element="button_marcar-como-concluido"]');
        if (btn && !btn.disabled) {
            btn.click();
            return true;
        }
        return false;
    });
    if (clicou) {
        console.log(`        ✅ Tema marcado como concluído`);
        await page.waitForTimeout(2000);
    }
    else {
        console.log(`        ⚠️ Botão "Marcar como concluído" não disponível`);
    }
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
    return await page.evaluate(() => {
        const listas: any[] = [];
        const cards = document.querySelectorAll('[data-testid="card-sucesso"]');
        cards.forEach((card) => {
            try {
                const tituloEl = card.querySelector('[data-testid="card-sucesso-titulo"]');
                const titulo = tituloEl?.textContent?.trim() || '';
                const subtituloEl = card.querySelector('[data-testid="card-sucesso-subtitulo"]');
                const tema = subtituloEl?.textContent?.trim() || '';
                const botaoAcessar = card.querySelector('[data-testid="card-sucesso-botao"]');
                const listaId = botaoAcessar?.getAttribute('data-info') || '';
                const tagEl = card.querySelector('[data-testid="card-tag"]');
                const status = tagEl?.getAttribute('aria-label') || tagEl?.textContent?.trim() || '';
                if (titulo && listaId) {
                    listas.push({ titulo, tema, listaId, status, questoes: [] });
                }
            }
            catch (e) { }
        });
        return listas;
    });
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
    console.log(`  💾 Conteúdos salvos em: ${caminho}`);
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
                const btn = document.querySelector<HTMLButtonElement>('[data-element="button_finalizar-prova"]');
                if (btn && !btn.disabled) {
                    btn.click();
                    return true;
                }
                return false;
            });
            if (finalizou) {
                try {
                    await page.waitForSelector('[data-testid="submit-button"]', { timeout: 5000 });
                    await page.evaluate(() => {
                        const btn = document.querySelector<HTMLElement>('[data-testid="submit-button"]');
                        if (btn)
                            btn.click();
                    });
                    await page.waitForTimeout(3000);
                    console.log(`    ✅ Exercício finalizado`);
                }
                catch {
                    console.log(`    ⚠️ Modal de confirmação não apareceu, exercício pode já ter sido finalizado`);
                }
            }
            else {
                console.log(`    ⚠️ Botão "Finalizar" não disponível (talvez nem todas respondidas)`);
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
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page: Page = await context.newPage();

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
            console.log('🤖 Analisando exercícios com a LLM...');
            const respostas = await analisarExercicios(listasComQuestoes);
            await salvarRespostasJSON(respostas ?? {}, nomeArquivoDisciplina(disciplina.nome));
            if (respostas) {
                await enviarRespostasExercicios(page, disciplina, respostas);
            }
            else {
                await salvarPedidoAjuda(listasComQuestoes, disciplina.nome, 'LLM não retornou JSON de respostas');
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