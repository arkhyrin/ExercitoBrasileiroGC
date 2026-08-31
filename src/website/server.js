import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, "public");

const types = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

const server = createServer(async (req, res) => {
    try {
        let file = req.url || "/";

        file = file.split("?")[0];

        if (file === "/") {
            file = "/index.html";
        }

        const filePath = join(publicDir, file);

        const content = await readFile(filePath);

        res.writeHead(200, {
            "Content-Type":
                types[extname(file).toLowerCase()] ||
                "application/octet-stream"
        });

        res.end(content);
    } catch (error) {
        console.error(error);

        res.writeHead(404, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("404 - Página não encontrada");
    }
});

server.listen(80, () => {
    console.log("Site rodando na porta 80");
});