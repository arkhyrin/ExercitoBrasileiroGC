import {
    Client,
    Message,
    TextChannel
} from "discord.js";

import { perguntarIA } from "../../services/ollama.js";

import discordConfig from "../../../config/discord.json" with { type: "json" };

const forbiddenResponses = [
    "@everyone",
    "@here",
    "01"
];

const forbiddenQuestions = [
    "binario"
];

export default {
    name: "ia",

    aliases: [
        "ai",
        "chat"
    ],

    prefix: [
        "."
    ],

    description: "Conversa com a inteligência artificial.",

    async execute(
        client: Client,
        message: Message
    ) {
        if (
            message.guildId !== discordConfig.mainServerId
        ) {
            return;
        }

        if (
            message.channelId !==
            discordConfig.mainServerData.AIChannelId
        ) {
            return;
        }

        if (!client.user) {
            return;
        }

        const question = message.content
            .replace(
                new RegExp(`<@!?${client.user.id}>`, "g"),
                ""
            )
            .trim();

        if (!question) {
            await message.reply("fala aí, bb");
            return;
        }

        console.log(
            `[IA] ${message.author.username}: ${question}`
        );

        if (message.channel instanceof TextChannel) {
            await message.channel.sendTyping();
        }

        let response = await perguntarIA(
            question,
            message.author.id
        );

        const forbiddenResponse =
            forbiddenResponses.some(
                forbidden =>
                    response.includes(forbidden)
            );

        const normalizedQuestion = question
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

        const forbiddenQuestionFound =
            forbiddenQuestions.some(
                forbidden =>
                    normalizedQuestion.includes(
                        forbidden
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .toLowerCase()
                    )
            );

        if (
            forbiddenResponse ||
            forbiddenQuestionFound
        ) {
            console.log(
                "[IA] Resposta bloqueada por conter uma resposta/pergunta proibida."
            );

            await message.reply(
                "Desculpe, mas não posso responder a isso."
            );

            return;
        }

        if (
            question
                .toLowerCase()
                .includes("bpe")
        ) {
            response = "UMA VEZ PE SEMPRE CHULE!";
        }

        await message.reply(response);

        console.log(
            `[IA] Resposta: ${response}`
        );
    }
};