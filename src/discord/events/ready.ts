import {
    Client
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

const GUILD_ID = "1515750409225113620";

type BannedUser = {
    userId: string;
    guildId: string;
    expiresAt: number | null;
    reason: string;
    moderatorId: string;
    moderatorTag: string;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const bannedUsersPath = resolve(
    __dirname,
    "../../data/bannedUsers.json"
);

async function getBannedUsers(): Promise<BannedUser[]> {
    try {
        const data = await readFile(
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

async function restoreBans(
    client: Client
) {
    const guild =
        client.guilds.cache.get(
            GUILD_ID
        );

    if (!guild) {
        return;
    }

    var bannedUsers =
        await getBannedUsers();

    if (!bannedUsers.length) {
        return;
    }

    var remainingBans: BannedUser[] = [];

    for (const bannedUser of bannedUsers) {
        if (
            bannedUser.guildId !== guild.id
        ) {
            remainingBans.push(
                bannedUser
            );

            continue;
        }

        if (
            bannedUser.expiresAt === null
        ) {
            remainingBans.push(
                bannedUser
            );

            continue;
        }

        var remainingTime =
            bannedUser.expiresAt -
            Date.now();

        if (remainingTime <= 0) {
            try {
                await guild.bans.remove(
                    bannedUser.userId,
                    "Banimento temporário encerrado."
                );

                console.log(
                    `[BAN] ${bannedUser.userId} desbanido.`
                );
            } catch {
            }

            continue;
        }

        remainingBans.push(
            bannedUser
        );

        setTimeout(
            async () => {
                try {
                    await guild.bans.remove(
                        bannedUser.userId,
                        `Banimento temporário encerrado.`
                    );

                    var currentBans =
                        await getBannedUsers();

                    currentBans =
                        currentBans.filter(
                            ban =>
                                !(
                                    ban.userId === bannedUser.userId &&
                                    ban.guildId === bannedUser.guildId
                                )
                        );

                    await saveBannedUsers(
                        currentBans
                    );

                    console.log(
                        `[BAN] ${bannedUser.userId} desbanido.`
                    );
                } catch {
                }
            },
            remainingTime
        );
    }

    await saveBannedUsers(
        remainingBans
    );
}

export function registerReady(
    client: Client
) {
    client.once(
        "ready",
        async readyClient => {
            const guild =
                readyClient.guilds.cache.get(
                    GUILD_ID
                );

            if (!guild) {
                console.log(
                    "Servidor não encontrado."
                );

                return;
            }

            console.log(
                `Logado como ${readyClient.user.tag}`
            );

            await restoreBans(
                readyClient
            );
        }
    );
}