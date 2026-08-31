import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, "public");

const server = createServer(async (req, res) => {
    try {
        let file = req.url === "/" ? "index.html" : req.url;

        // Evita problemas com query strings, como /style.css?v=1
        file = file.split("?")[0];

        const filePath = join(publicDir, file);

        const content = await readFile(filePath);

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

        res.writeHead(200, {
            "Content-Type":
                types[extname(file).toLowerCase()] ||
                "application/octet-stream"
        });

        res.end(content);
    } catch {
        res.writeHead(404, {
            "Content-Type": "text/plain; charset=utf-8"
        });

        res.end("404 - Página não encontrada");
    }
});

server.listen(3000, () => {
    console.log("Site rodando em http://localhost:3000");
});