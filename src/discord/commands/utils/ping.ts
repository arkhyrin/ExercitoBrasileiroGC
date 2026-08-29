import {
    Client,
    Message
} from "discord.js";

export default {
    name: "ping",
    aliases: [
        "p"
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

        const reply = await message.reply(
            "🏓 Calculando..."
        );

        const latency =
            Date.now() - startTime;

        await reply.edit(
            `🏓 Pong!\nLatência: **${latency}ms**\nWebSocket: **${client.ws.ping}ms**`
        );
    }
};