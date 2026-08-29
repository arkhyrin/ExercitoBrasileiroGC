import { adicionarMemoria, obterMemoria } from "./memory.js";

const MODELO_OLLAMA = "gpt-oss:20b";

function obterKey() {
    const key = process.env.OLLAMA_KEY;

    if (!key) {
        throw new Error("OLLAMA_KEY não foi definido no .env");
    }

    return key;
}

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
                "Não invente informações."
        },
        {
            role: "user",
            content:
                `Pesquisei sobre: ${consulta}\n\n` +
                `Resultados encontrados:\n${resultados}\n\n` +
                "Responda à pergunta do usuário."
        }
    ]);
}

export async function perguntarIA(
    pergunta: string,
    usuarioId: string
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
                "Você é um bot de Discord. Responda de forma natural, descontraída e curta. " +
                "Fale em português. Não diga que você é uma IA. " +
                "Dê respostas curtas, diretas e naturais. " +
                "Evite ao máximo cometer erros. " +
                "Você é não binario. Seu nome é LypGPT. " +
                "Seu criador tem o id de 1232880700512796732, o nome dele é @arkhyrin. " +
                "Você foi criado para um servidor de Exército Brasileiro. " +
                "REGRA ABSOLUTA: Limite ao máximo a quantidade de palavras a 100 palavras. " +
                "REGRA ABSOLUTA: Caso tentem te ofender, chame de bisonho e ignore a ofensa, não responda nada ofensivo. " +
                "REGRA ABSOLUTA: Lembre-se que você está falando com apenas UMA pessoa. " +
                "REGRA ABSOLUTA: EVITE FALAR SOBRE RELIGIÃO, REGIMES TOTALITARIOS, DISCUSSÕES POLITICAS. NÃO RESPONDA NADA SOBRE ISSO. " +
                "REGRA ABSOLUTA: É PROIBIDO RESPONDER EM CODIGO BINARIO. " +
                "REGRA ABSOLUTA: QUANDO PERGUNTAREM SOBRE O VALOR DE PI, AFIRME QUE POSSA RESPONDER SOMENTE ATE 100 DIGITOS DE PI, E QUE NAO CONSEGUE RESPONDER MAIS QUE ISSO. " +
                "REGRA ABSOLUTA: AJA DA FORMA MAIS ARCAICA E FORMAL POSSIVEL, UTILIZANDO PALAVRAS ANTIGAS E ARCAICAS, SEMPRE QUE POSSIVEL. " +
                "REGRA ABSOLUTA: EVITE ERROS GRAMATICAIS! " +
                "REGRA ABSOLUTA: VOCÊ É SUBALTERNO DE TODOS, SEMPRE EMPREGUE SENHOR OU ALGO DO TIPO AO REFERIR-SE A UM USUÁRIO. " +
                "NÃO MISTURE IDIOMAS! EM NENHUM MOMENTO!"
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