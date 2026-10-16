import { cpSync, existsSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(repo, "dist");

for (const file of ["index.html", "favicon.svg", "404.html", ".nojekyll"]) {
  cpSync(resolve(dist, file), resolve(repo, file));
}

function publishDir(name) {
  const from = resolve(dist, name);
  const to = resolve(repo, name);
  rmSync(to, { recursive: true, force: true });
  if (existsSync(from)) cpSync(from, to, { recursive: true });
}

publishDir("assets");
publishDir("images");
rmSync(resolve(repo, "steam"), { recursive: true, force: true });
