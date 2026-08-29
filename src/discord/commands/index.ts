import {
    readdir
} from "node:fs/promises";

import {
    join,
    extname,
    dirname
} from "node:path";

import {
    Client,
    Message
} from "discord.js";

import {
    fileURLToPath,
    pathToFileURL
} from "node:url";

type Command = {
    name: string;
    aliases: string[];
    prefix: string[];
    description: string;
    execute: (
        client: Client,
        message: Message
    ) => Promise<void>;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const commands: Command[] = [];

async function loadCommands(directory: string) {
    const files = await readdir(
        directory,
        {
            withFileTypes: true
        }
    );

    for (const file of files) {
        const filePath = join(
            directory,
            file.name
        );

        if (file.isDirectory()) {
            await loadCommands(filePath);
            continue;
        }

        if (
            file.name === "index.ts" ||
            file.name === "index.js"
        ) {
            continue;
        }

        const extension = extname(file.name);

        if (
            extension !== ".js"
        ) {
            continue;
        }

        const module = await import(
            pathToFileURL(filePath).href
        );

        const command: Command | undefined =
            module.default;

        if (!command) {
            continue;
        }

        if (
            commands.some(
                loadedCommand =>
                    loadedCommand.name === command.name
            )
        ) {
            continue;
        }

        commands.push(command);

        console.log(
            `[COMMAND] ${command.name} carregado.`
        );
    }
}

await loadCommands(__dirname);

export default commands;