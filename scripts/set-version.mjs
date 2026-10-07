#!/usr/bin/env node
// Sets the version of every package under npm/ and pins the main package's
// optionalDependencies on the platform packages to that same version.
// Usage: node scripts/set-version.mjs 0.2.16
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const version = process.argv[2];
if (!version || !/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version)) {
  console.error("usage: set-version.mjs <semver>");
  process.exit(1);
}

const root = new URL("../npm/", import.meta.url).pathname;
for (const dir of readdirSync(root)) {
  const file = join(root, dir, "package.json");
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  pkg.version = version;
  for (const dep of Object.keys(pkg.optionalDependencies ?? {})) {
    pkg.optionalDependencies[dep] = version;
  }
  writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`${pkg.name}@${version}`);
}
