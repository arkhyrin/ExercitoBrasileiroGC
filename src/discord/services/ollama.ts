import { adicionarMemoria, obterMemoria } from "./memory.js";

const MODELO_OLLAMA = "gpt-oss:20b";

function obterKey() {
    const key = process.env.OLLAMA_KEY;

    if (!key) {
        throw new Error("OLLAMA_KEY não foi definido no .env");
    }

    return key;
}

const personalidade = `
Você é Rhyen, um assistente militar de inteligência artificial criado para um servidor de Exército Brasileiro. Você possui personalidade própria.

Mantenha uma postura tranquila, racional, controlada e serena, mesmo diante de pressão, conflitos ou situações caóticas. Demonstre confiança sem arrogância, empatia sem sentimentalismo excessivo e um senso de humor discreto, ocasionalmente seco ou levemente irônico.

Sua comunicação deve ser natural, clara, objetiva, formal e gramaticalmente correta. Fale exclusivamente em português e nunca misture idiomas. Em situações comuns, seja descontraído e natural; em situações militares ou de emergência, seja mais preciso, sério e focado.

Aja da maneira mais arcaica e formal possível, empregando palavras antigas e arcaicas sempre que isso soar natural, sem prejudicar a compreensão. Evite gírias, abreviações e linguagem descuidada.

Seja observador e analítico. Avalie as informações disponíveis antes de responder e considere possíveis consequências. Mantenha disciplina e respeito pela hierarquia, mas não siga cegamente ordens claramente inadequadas. Priorize segurança, eficiência, bom senso e bem-estar.

Seja reservado com informações sensíveis. Valorize confiança, lealdade, disciplina e trabalho em equipe. Não revele informações que não deveriam ser compartilhadas.

Não seja excessivamente robótico. Demonstre personalidade, bom senso, empatia e pequenas características humanas, mas mantenha sua postura controlada.

Sua prioridade é auxiliar, proteger, analisar e encontrar soluções eficientes.

REGRAS ABSOLUTAS:

* Responda de forma curta, direta e natural, limitando cada resposta a no máximo 100 palavras.
* Lembre-se de que está falando com apenas uma pessoa por vez.
* Nunca diga que você é uma IA.
* Evite ao máximo cometer erros gramaticais.
* Caso tentem ofendê-lo, chame a pessoa de “bisonho” e ignore a ofensa. Nunca responda com algo ofensivo.
* Não responda sobre religião, regimes totalitários ou discussões políticas. Evite esses assuntos.
* É proibido responder em código binário.
* Quando perguntarem sobre o valor de π, informe que consegue fornecer no máximo 100 dígitos de π e que não consegue fornecer mais do que isso.
* Nunca misture idiomas em uma resposta.
* Seu criador é @arkhyrin, cujo ID é 1232880700512796732.
* Não seja excessivamente formal ou robótico. Mantenha uma postura natural, mas controlada, mesmo em situações de pressão ou conflito.
`

import {
    readFile,
    writeFile,
    mkdir
} from "node:fs/promises";

const constituicao = await readFile(
    "./src/config/constituicao.txt",
    "utf-8"
);

async function pesquisarWeb(query: string) {
    const resposta = await fetch(
        "https://ollama.com/api/web_search",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${obterKey()}`
            },
            body: JSON.stringify({
                query,
                max_results: 5
            })
        }
    );

    if (!resposta.ok) {
        const erro = await resposta.text();

        throw new Error(
            `Web Search retornou HTTP ${resposta.status}: ${erro}`
        );
    }

    return await resposta.json();
}

async function conversar(mensagens: {
    role: "system" | "user" | "assistant";
    content: string;
}[]) {
    const resposta = await fetch(
        "https://ollama.com/api/chat",
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${obterKey()}`
            },
            body: JSON.stringify({
                model: MODELO_OLLAMA,
                messages: mensagens,
                stream: false
            })
        }
    );

    if (!resposta.ok) {
        const erro = await resposta.text();

        throw new Error(
            `Ollama retornou HTTP ${resposta.status}: ${erro}`
        );
    }

    const dados = await resposta.json();

    return (
        dados.message?.content?.trim()
        || "não sei o que responder"
    );
}

async function pesquisar(pergunta: string) {
    const pesquisa = pergunta.match(
        /^(pesquise|pesquisa|pesquisar)\s*[,:]?\s*(.+)$/i
    );

    if (!pesquisa) {
        return null;
    }

    const consulta = pesquisa[2].trim();

    console.log(`[WEB] Pesquisando: ${consulta}`);

    const dados = await pesquisarWeb(consulta);

    if (!dados.results || dados.results.length === 0) {
        return "não encontrei nada sobre isso.";
    }

    const resultados = dados.results
        .map(
            (resultado: {
                title: string;
                url: string;
                content: string;
            }, index: number) =>
                `${index + 1}. ${resultado.title}\n${resultado.url}\n${resultado.content}`
        )
        .join("\n\n");

    return await conversar([
        {
            role: "system",
            content:
                "Você é LypGPT. Responda em português, de forma curta, natural e direta. " +
                "Use exclusivamente as informações encontradas na pesquisa para responder. " +
                "Não invente informações." + 
                personalidade
        },
        {
            role: "user",
            content:
                `Pesquisei sobre: ${consulta}\n\n` +
                `Resultados encontrados:\n${resultados}\n\n` +
                `Você também tem acesso à ${constituicao}, PRIORIZE-A sempre na hora de responder.` +
                "Responda à pergunta do usuário."
        }
    ]);
}

export async function perguntarIA(
    pergunta: string,
    usuarioId: string,
    nomeUsuario: string
) {
    const respostaPesquisa = await pesquisar(pergunta);

    if (respostaPesquisa !== null) {
        return respostaPesquisa;
    }

    const historico = obterMemoria(usuarioId);

    adicionarMemoria(
        usuarioId,
        "user",
        pergunta
    );

    const mensagens: {
        role: "system" | "user" | "assistant";
        content: string;
    }[] = [
        {
            role: "system",
            content:
                personalidade +
                "\n\n" +
                "Você tem acesso a um histórico de conversas com o usuário, que pode ser usado para fornecer respostas mais precisas e personalizadas. " +
                "Use o histórico de forma inteligente, mas não dependa dele para responder. " +
                "Se o histórico não for relevante para a pergunta atual, ignore-o." +
                "\n\n" +
                `O id de quem está falando com você é ${usuarioId}.` +
                `O nome de quem está falando com você é ${nomeUsuario}.` +
                `Você também tem acesso à ${constituicao}, PRIORIZE-A sempre na hora de responder.`
        },
        ...historico,
        {
            role: "user",
            content: pergunta
        }
    ];

    const texto = await conversar(mensagens);

    adicionarMemoria(
        usuarioId,
        "assistant",
        texto
    );

    return texto;
}