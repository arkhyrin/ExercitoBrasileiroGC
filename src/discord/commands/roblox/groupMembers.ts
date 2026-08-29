import {
    Client,
    Message
} from "discord.js";

import { 
    getMainGroupMemberCount
} from "../../../roblox/services/checkGroupMembers.js";

import robloxConfig from "../../../config/roblox.json" with { type: "json" };

export default {
    name: "groupMembers",
    aliases: [
        "gm"
    ],
    prefix: [
        "."
    ],
    description: "Verifica o número de membros do grupo.",

    async execute(
        client: Client,
        message: Message
    ) {
        const reply = await message.reply(
            "⚙️ Calculando..."
        );

        await reply.edit(
            `⚙️ Membros no [grupo](https://www.roblox.com/communities/${robloxConfig.mainGroupId}): **${await getMainGroupMemberCount()}**`
        );
    }
};