import { cpSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(repo, "dist");

for (const file of ["index.html", "favicon.svg", "404.html", ".nojekyll"]) {
  cpSync(resolve(dist, file), resolve(repo, file));
}

rmSync(resolve(repo, "assets"), { recursive: true, force: true });
cpSync(resolve(dist, "assets"), resolve(repo, "assets"), { recursive: true });
rmSync(resolve(repo, "steam"), { recursive: true, force: true });
