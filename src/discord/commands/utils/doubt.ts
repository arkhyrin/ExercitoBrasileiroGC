import {
    Client,
    Message
} from "discord.js";

import { perguntarIA } from "../../services/ollama.js";

export default {
    name: "teste",
    aliases: [
        "t"
    ],
    prefix: [
        "."
    ],
    description: "Verifica a latência do bot.",

    async execute(
        client: Client,
        message: Message
    ) {
        const startTime = Date.now();

        
    }
};