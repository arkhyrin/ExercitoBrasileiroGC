import {
    Client,
    GatewayIntentBits,
    TextChannel
} from "discord.js";

import dotenv from "dotenv";

import { registerMessageCreate } from "./events/messageCreate.js";
import { registerReady } from "./events/ready.js";

import discordConfig from "../config/discord.json" with { type: "json" };

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

registerMessageCreate(client);
registerReady(client);

const TOKEN = process.env.DISCORD_BOT_TOKEN;

if (!TOKEN) {
    throw new Error("DISCORD_BOT_TOKEN não foi definido no .env");
}

client.login(TOKEN);

function sendRandomMessage() {
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

client.on("ready", () => {
    sendRandomMessage();

    setInterval(() => {
        sendRandomMessage();
    }, 1000 * 10 * 60); // 10 minutos
})