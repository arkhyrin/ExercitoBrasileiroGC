import { cp } from "node:fs/promises";

await cp("src/website/public", "dist/src/website/public", {
    recursive: true
});

console.log("Website copiado.");