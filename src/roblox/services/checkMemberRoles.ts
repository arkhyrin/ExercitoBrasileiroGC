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

export async function getMainGroupMembers() {
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

    return pages.flatMap(
        page => page.data
    );
}

export async function getMainGroupMemberRoles() {
    const members =
        await getMainGroupMembers();

    return members.map(member => ({
        userId: member.user.userId,
        username: member.user.username,
        displayName: member.user.displayName,
        roleId: member.role.id,
        roleName: member.role.name,
        roleRank: member.role.rank
    }));
}