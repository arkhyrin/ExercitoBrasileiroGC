import {
    Client,
    Message,
    TextChannel
} from "discord.js";

import {
    readFile,
    writeFile,
    mkdir
} from "node:fs/promises";

import {
    dirname,
    resolve
} from "node:path";

import {
    fileURLToPath
} from "node:url";

import discordConfig from "../../../config/discord.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bannedUsersPath = resolve(
    __dirname,
    "../../../data/bannedUsers.json"
);

type BannedUser = {
    userId: string;
    guildId: string;
    expiresAt: number | null;
    reason: string;
    moderatorId: string;
    moderatorTag: string;
};

async function getBannedUsers(): Promise<BannedUser[]> {
    try {
        var data = await readFile(
            bannedUsersPath,
            "utf8"
        );

        return JSON.parse(data);
    } catch {
        await mkdir(
            dirname(bannedUsersPath),
            {
                recursive: true
            }
        );

        await writeFile(
            bannedUsersPath,
            "[]",
            "utf8"
        );

        return [];
    }
}

async function saveBannedUsers(
    bannedUsers: BannedUser[]
) {
    await mkdir(
        dirname(bannedUsersPath),
        {
            recursive: true
        }
    );

    await writeFile(
        bannedUsersPath,
        JSON.stringify(
            bannedUsers,
            null,
            4
        ),
        "utf8"
    );
}

export default {
    name: "ban",

    aliases: [
        "punish"
    ],

    prefix: [
        "."
    ],

    description: "Bane um usuário do servidor.",

    async execute(
        client: Client,
        message: Message
    ) {
        var mainServer = client.guilds.cache.get(
            discordConfig.mainServerId
        );

        var coexServer = client.guilds.cache.get(
            discordConfig.otherServerIds.COEx
        );

        var banChannel = coexServer?.channels.cache.get(
            discordConfig.otherServerData.COEx.banChannelId
        ) as TextChannel;

        var hasPerm =
            message.member?.permissions.has("BanMembers") ||
            message.member?.permissions.has("Administrator");

        var parts = message.content.split(" ");

        var userToBan =
            message.mentions.members?.first();

        if (
            !userToBan &&
            mainServer &&
            parts[1]
        ) {
            try {
                userToBan =
                    await mainServer.members.fetch(parts[1]);
            } catch {
                userToBan = undefined;
            }
        }

        var duration =
            parts[2] ||
            "Tempo indefinido";

        var reason =
            parts.slice(3).join(" ") ||
            "Sem motivo especificado.";

        var formatDuration = (
            value: string
        ): string => {
            var match = value.match(
                /^(\d+)([smhdw])$/i
            );

            if (!match) {
                return value;
            }

            var amount = Number(match[1]);
            var unit = match[2].toLowerCase();

            var units: Record<string, string> = {
                s: amount === 1
                    ? "segundo"
                    : "segundos",

                m: amount === 1
                    ? "minuto"
                    : "minutos",

                h: amount === 1
                    ? "hora"
                    : "horas",

                d: amount === 1
                    ? "dia"
                    : "dias",

                w: amount === 1
                    ? "semana"
                    : "semanas"
            };

            return `${amount} ${units[unit]}`;
        };

        var formattedDuration =
            formatDuration(duration);

        if (!hasPerm) {
            await message.reply(
                "❌ Você não tem permissão para banir membros."
            );

            return;
        }

        if (!userToBan) {
            await message.reply(
                "❌ Você precisa mencionar um usuário ou informar um ID válido para banir."
            );

            return;
        }

        if (!banChannel) {
            await message.reply(
                "❌ O canal de banimentos não foi encontrado."
            );

            return;
        }

        var durationMs = 0;

        var match = duration.match(
            /^(\d+)([smhdw])$/i
        );

        if (match) {
            var amount = Number(match[1]);
            var unit = match[2].toLowerCase();

            var multipliers: Record<string, number> = {
                s: 1000,
                m: 60 * 1000,
                h: 60 * 60 * 1000,
                d: 24 * 60 * 60 * 1000,
                w: 7 * 24 * 60 * 60 * 1000
            };

            durationMs =
                amount * multipliers[unit];
        }

        var userId =
            userToBan.user.id;

        var expiresAt =
            durationMs > 0
                ? Date.now() + durationMs
                : null;

        var relatorio =
            discordConfig.relatorios.Ban
                .replace(
                    "{RESPONSAVEL}",
                    `<@${message.author.id}>`
                )
                .replace(
                    "{INFRATOR}",
                    `${userToBan.user.id}.`
                )
                .replace(
                    "{MOTIVO}",
                    reason
                )
                .replace(
                    "{TEMPO}",
                    `${formattedDuration}.`
                )
                .replace(
                    "{PLATAFORMA}",
                    "Discord."
                );

        var attachments =
            message.attachments.map(
                attachment => attachment.url
            );

        await userToBan.ban({
            reason:
                `Banido por ${message.author.tag} // ${message.author.id} | ` +
                `Motivo: ${reason} | ` +
                `Duração: ${formattedDuration}`,

            deleteMessageSeconds: 604800
        });

        var bannedUsers =
            await getBannedUsers();

        bannedUsers.push({
            userId,
            guildId: mainServer!.id,
            expiresAt,
            reason,
            moderatorId: message.author.id,
            moderatorTag: message.author.tag
        });

        await saveBannedUsers(
            bannedUsers
        );

        await banChannel.send({
            content: relatorio,
            files: attachments
        });

        await message.reply(
            `${userToBan.user.tag} foi banido com sucesso.`
        );

        if (durationMs > 0) {
            setTimeout(
                async () => {
                    try {
                        await mainServer?.bans.remove(
                            userId,
                            `Banimento de ${formattedDuration} encerrado.`
                        );

                        var currentBans =
                            await getBannedUsers();

                        currentBans =
                            currentBans.filter(
                                banned =>
                                    !(
                                        banned.userId === userId &&
                                        banned.guildId === mainServer?.id
                                    )
                            );

                        await saveBannedUsers(
                            currentBans
                        );
                    } catch {
                    }
                },
                durationMs
            );
        }
    }
};