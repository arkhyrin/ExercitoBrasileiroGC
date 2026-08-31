import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const source = path.resolve("src");
const destination = path.resolve("dist/src");

if (!existsSync(destination)) {
    await mkdir(destination, { recursive: true });
}

await cp(source, destination, {
    recursive: true,
    filter: (src) => {
        return /\.(html|css)$/i.test(src) || !path.extname(src);
    }
});

console.log("Arquivos HTML e CSS copiados.");