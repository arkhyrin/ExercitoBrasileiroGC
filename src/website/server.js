import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";

const server = createServer(async (req, res) => {
    try {
        let file = req.url === "/" ? "/index.html" : req.url;

        const filePath = join(process.cwd(), "public", file);

        const content = await readFile(filePath);

        const types = {
            ".html": "text/html",
            ".css": "text/css",
            ".js": "text/javascript",
            ".json": "application/json",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".svg": "image/svg+xml"
        };

        res.writeHead(200, {
            "Content-Type": types[extname(file)] || "application/octet-stream"
        });

        res.end(content);
    } catch {
        res.writeHead(404, {
            "Content-Type": "text/plain"
        });

        res.end("404 - Página não encontrada");
    }
});

server.listen(3000, () => {
    console.log("Site rodando em http://localhost:3000");
});