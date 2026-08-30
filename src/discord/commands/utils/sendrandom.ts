import {
    Client,
    GatewayIntentBits,
    Message,
    TextChannel
} from "discord.js";

import discordConfig from "../../../config/discord.json" with { type: "json" };

function sendRandomMessage(client: Client) {
    const messages = discordConfig.RandomMessages;

    if (!messages?.length) {
        return;
    }

    const randomMessage =
        messages[Math.floor(Math.random() * messages.length)];

    const channel = client.channels.cache.get(
        discordConfig.mainServerData.randomMessagesChannelId
    ) as TextChannel | undefined;

    if (!channel) {
        console.error(
            "Canal de mensagens aleatórias não encontrado:",
            discordConfig.mainServerData.randomMessagesChannelId
        );

        return;
    }

    channel.send(randomMessage).catch((error) => {
        console.error(
            "Erro ao enviar mensagem aleatória:",
            error
        );
    });
}

export default {
    name: "sendrandom",
    aliases: [
        "sr"
    ],
    prefix: [
        "."
    ],
    description: "Envia uma mensagem aleatória.",

    async execute(
        client: Client,
        message: Message
    ) {
        if (message.member?.id !== "1515879832020320377") {
            return message.reply(
                "❌ Você não tem permissão para usar este comando."
            );
        }
        
        sendRandomMessage(client);
    }
};