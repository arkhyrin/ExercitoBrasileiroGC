import {
    Client,
    GatewayIntentBits,
    TextChannel,
    ActivityType
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

const statusType = {
    PLAYING: ActivityType.Playing,
    STREAMING: ActivityType.Streaming,
    LISTENING: ActivityType.Listening,
    WATCHING: ActivityType.Watching,
    COMPETING: ActivityType.Competing
} as const;

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

function pullRandomStatus() {
    const statuses = discordConfig.RandomStatus;

    if (!statuses?.length) {
        return;
    }

    const randomStatus =
        statuses[Math.floor(Math.random() * statuses.length)];

    const type =
        statusType[
            randomStatus.type as keyof typeof statusType
        ];

    if (type === undefined) {
        console.error(
            "Tipo de presença inválido:",
            randomStatus.type
        );

        return;
    }

    return {
        name: randomStatus.message,
        type
    };
}

function updateRandomStatus() {
    const randomStatus = pullRandomStatus();

    if (!randomStatus) {
        return;
    }

    client.user?.setPresence({
        activities: [
            {
                name: randomStatus.name,
                type: randomStatus.type
            }
        ],
        status: "online"
    });
}

client.once("ready", () => {
    updateRandomStatus();

    setInterval(() => {
        updateRandomStatus();
    }, 1000 * 60 * 5);

    sendRandomMessage();

    setInterval(() => {
        sendRandomMessage();
    }, 1000 * 10 * 60);
});

client.login(TOKEN);