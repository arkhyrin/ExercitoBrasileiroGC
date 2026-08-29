import {
    Client,
    GatewayIntentBits
} from "discord.js";

import dotenv from "dotenv";

import { registerMessageCreate } from "./events/messageCreate.js";
import { registerReady } from "./events/ready.js";

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