import { loginAndScrape } from './scripts/scraper.js';
import { sendToTelegram } from './services/telegram.ts';
import { Env } from "./utils/Environment.js";

async function main() {
    try {
        console.log("Iniciando monitoramento...");

        // 1. Executa o Scraper
        const conteudo = await loginAndScrape(
            Env.FACULDADE_USER,
            Env.FACULDADE_PASS
        );

        // 2. Envia para o Telegram
        await sendToTelegram(conteudo);

        console.log("Tarefa concluída com sucesso!");
    } catch (error) {
        console.error("Erro na execução:", error);
        process.exit(1); // Importante para o Hermes saber que falhou
    }
}

main();