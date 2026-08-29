import {
    Client,
    EmbedBuilder,
    Message
} from "discord.js";

import {
    fetchApiPages,
    isAnyErrorResponse
} from "rozod";

import {
    getGroupsGroupidUsers
} from "rozod/endpoints/groupsv1";

import robloxConfig from "../../../config/roblox.json" with { type: "json" };

export default {
    name: "groupRole",
    aliases: [
        "role",
        "cargo"
    ],
    prefix: [
        "."
    ],
    description: "Verifica o cargo de um usuário no grupo.",

    async execute(
        client: Client,
        message: Message
    ) {
        const args = message.content
            .trim()
            .split(/\s+/)
            .slice(1);

        const username = args[0];

        if (!username) {
            await message.reply(
                "❌ Informe o nome do usuário do Roblox."
            );

            return;
        }

        const reply = await message.reply(
            "⚙️ Procurando usuário..."
        );

        const pages = await fetchApiPages(
            getGroupsGroupidUsers,
            {
                groupId: robloxConfig.mainGroupId,
                limit: 100
            }
        );

        if (isAnyErrorResponse(pages)) {
            throw new Error(
                `Erro ao buscar membros do grupo: ${pages.message}`
            );
        }

        let member = null;

        for (const page of pages) {
            member = page.data.find(
                member =>
                    member.user.username.toLowerCase() ===
                    username.toLowerCase()
            );

            if (member) {
                break;
            }
        }

        if (!member) {
            await reply.edit(
                `❌ O usuário **${username}** não foi encontrado no grupo.`
            );

            return;
        }

        const thumbnailResponse = await fetch(
            "https://thumbnails.roblox.com/v1/users/avatar-headshot" +
            `?userIds=${member.user.userId}` +
            "&size=150x150" +
            "&format=Png" +
            "&isCircular=false"
        );

        if (!thumbnailResponse.ok) {
            throw new Error(
                `Erro ao buscar thumbnail: ${thumbnailResponse.status}`
            );
        }

        const thumbnailData = await thumbnailResponse.json();

        const thumbnailUrl =
            thumbnailData.data?.[0]?.imageUrl;

        const embed = new EmbedBuilder()
            .setTitle("Informações do usuário")
            .setDescription(
                `**${member.user.displayName}** (@${member.user.username})`
            )
            .addFields(
                {
                    name: "Cargo",
                    value: `**${member.role.name}**`,
                    inline: true
                },
                {
                    name: "Rank",
                    value: `**${member.role.rank}**`,
                    inline: true
                }
            )
            .setURL(
                `https://www.roblox.com/users/${member.user.userId}/profile`
            );

        if (thumbnailUrl) {
            embed.setThumbnail(thumbnailUrl);
        }

        await reply.edit({
            content: "",
            embeds: [
                embed
            ]
        });
    }
};