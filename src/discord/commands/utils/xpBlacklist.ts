import {
    Client,
    Message
} from "discord.js";

export default {
    name: "xpBlacklist",
    aliases: [
        "xpbl"
    ],
    prefix: [
        "."
    ],
    description: "Adiciona ou remove um usuário da lista negra de XP.",

    async execute(
        client: Client,
        message: Message
    ) {
        const desclassificadoRole = message.guild?.roles.cache.get("1543734188073554032");

        if (!desclassificadoRole) {
            return message.reply("❌ Cargo de desclassificado não encontrado.");
        }

        if (!message.member?.roles.cache.has("1515879832020320377")) {
            return message.reply("Você não tem permissão para usar este comando.");
        }

        const userMention = message.mentions.users.first();

        if (!userMention) {
            return message.reply(
                "Você precisa mencionar um usuário para adicionar ou remover da lista negra de XP."
            );
        }

        const member = await message.guild?.members.fetch(userMention.id);

        if (member?.roles.cache.has(desclassificadoRole.id)) {
            await member.roles.remove(desclassificadoRole);
            return message.reply(
                `${userMention.username} foi removido da lista negra de XP.`
            );
        } else {
            await member?.roles.add(desclassificadoRole);
            return message.reply(
                `${userMention.username} foi adicionado à lista negra de XP.`
            );
        }
    }
};