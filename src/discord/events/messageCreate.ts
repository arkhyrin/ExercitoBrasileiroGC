import {
    Client,
    Message
} from "discord.js";

import commands from "../commands/index.js";
import { channel } from "node:diagnostics_channel";

export function registerMessageCreate(
    client: Client
) {
    client.on(
        "messageCreate",
        async (message: Message) => {
            if (message.author.bot) {
                return;
            }

            if (!client.user) {
                return;
            }

            const conteudo =
                message.content.trim();

            const mencionado =
                message.mentions.has(client.user);

            let comandoEncontrado;

            const doubtChannel = client.channels.cache.get("1544096868353581056");
            const currentChannel = message.channel

            for (const comando of commands as any[]) {
                if (mencionado && comando.name === "ia") {
                    comandoEncontrado = comando;
                    break;
                }
                
                if (doubtChannel === currentChannel && comando.name === "ia") {
                    comandoEncontrado = comando;
                    break;
                }
                
                const prefixo =
                    comando.prefix.find(
                        (prefix: string) =>
                            conteudo.startsWith(prefix)
                    );

                if (!prefixo) {
                    continue;
                }

                const partes =
                    conteudo
                        .slice(prefixo.length)
                        .trim()
                        .split(/\s+/);

                const nome =
                    partes[0]?.toLowerCase();

                if (
                    nome === comando.name.toLowerCase() ||
                    comando.aliases.some(
                        (alias: string) =>
                            alias.toLowerCase() === nome
                    )
                ) {
                    comandoEncontrado = comando;
                    break;
                }
            }

            if (!comandoEncontrado) {
                return;
            }

            try {
                await comandoEncontrado.execute(
                    client,
                    message
                );
            } catch (err) {
                console.error(
                    `Erro ao executar ${comandoEncontrado.name}:`,
                    err
                );

                await message.reply(
                    "deu ruim na minha cabeça aqui"
                );
            }
        }
    );
}