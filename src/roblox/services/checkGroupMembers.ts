import {
    configureServer,
    fetchApiPages,
    isAnyErrorResponse
} from "rozod";

import {
    getGroupsGroupidUsers
} from "rozod/endpoints/groupsv1";

import robloxConfig from "../../config/roblox.json" with { type: "json" };

import "dotenv/config";

configureServer({
    cookies: process.env.ROBLOX
});

const mainGroupId = robloxConfig.mainGroupId;

export async function getMainGroupMemberCount() {
    const pages = await fetchApiPages(
        getGroupsGroupidUsers,
        {
            groupId: mainGroupId,
            limit: 100
        }
    );

    if (isAnyErrorResponse(pages)) {
        throw new Error(
            `Erro ao buscar membros do grupo: ${pages.message}`
        );
    }

    return pages.reduce(
        (total, page) =>
            total + page.data.length,
        0
    );
}