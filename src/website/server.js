import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, "public");

const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8"
};

const server = createServer(async (req, res) => {
    try {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);
        let pathname = decodeURIComponent(url.pathname);

        if (pathname === "/") {
            pathname = "/index.html";
        }

        const filePath = normalize(join(publicDir, pathname));

        if (!filePath.startsWith(publicDir)) {
            res.writeHead(403);
            res.end("403 - Acesso negado");
            return;
        }

        const content = await readFile(filePath);

        const extension = extname(filePath).toLowerCase();

        res.writeHead(200, {
            "Content-Type": types[extension] || "application/octet-stream"
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

server.listen(80, "0.0.0.0", () => {
    console.log("Servidor rodando em http://localhost");
});