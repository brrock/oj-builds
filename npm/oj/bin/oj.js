#!/usr/bin/env node
"use strict";

const { spawnSync } = require("child_process");
const { binaryPath, vendoredRolldownDir } = require("..");

let bin;
try {
  bin = binaryPath();
} catch (e) {
  console.error(e.message);
  process.exit(1);
}

const env = { ...process.env };
if (env.OJ_VENDORED_ROLLDOWN === undefined) {
  const dir = vendoredRolldownDir();
  if (dir) env.OJ_VENDORED_ROLLDOWN = dir;
}

const result = spawnSync(bin, process.argv.slice(2), { stdio: "inherit", env });
if (result.error) {
  console.error(`@brrock/oj: failed to run ${bin}: ${result.error.message}`);
  process.exit(1);
}
if (result.signal) process.kill(process.pid, result.signal);
process.exit(result.status ?? 1);
