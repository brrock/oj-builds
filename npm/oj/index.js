"use strict";

const fs = require("fs");
const path = require("path");

const PLATFORMS = {
  "linux-x64": "@brrock/oj-linux-x64-gnu",
  "linux-arm64": "@brrock/oj-linux-arm64-gnu",
};

/** Absolute path to the oj binary for this machine. Throws if unsupported. */
function binaryPath() {
  if (process.env.OJ_BINARY_PATH) return process.env.OJ_BINARY_PATH;

  const key = `${process.platform}-${process.arch}`;
  const pkg = PLATFORMS[key];
  if (!pkg) {
    throw new Error(
      `@brrock/oj: no prebuilt oj for ${key}. Supported: ${Object.keys(PLATFORMS).join(", ")}.\n` +
        "On other platforms install oj with `cargo install oj --locked` and set OJ_BINARY_PATH.",
    );
  }

  let bin;
  try {
    bin = require.resolve(`${pkg}/bin/oj`);
  } catch {
    throw new Error(
      `@brrock/oj: the platform package "${pkg}" is not installed.\n` +
        "It is an optionalDependency; make sure optional dependencies are not omitted " +
        "(--omit=optional / --no-optional) and that your lockfile was not created on a different platform only.",
    );
  }

  // npm normally keeps the exec bit, but some installers/caches drop it.
  try {
    fs.accessSync(bin, fs.constants.X_OK);
  } catch {
    try {
      fs.chmodSync(bin, 0o755);
    } catch {}
  }
  return bin;
}

/**
 * Directory holding node_modules/rolldown, for OJ_VENDORED_ROLLDOWN: oj runs
 * its own TanStack Start bundles on the rolldown it was tested against
 * (the upstream nix build vendors it the same way). Returns undefined if
 * rolldown can't be found, in which case oj falls back to the app's copy.
 */
function vendoredRolldownDir() {
  try {
    const pkgJson = fs.realpathSync(require.resolve("rolldown/package.json"));
    // .../<dir>/node_modules/rolldown/package.json -> <dir>
    return path.dirname(path.dirname(path.dirname(pkgJson)));
  } catch {
    return undefined;
  }
}

module.exports = { binaryPath, vendoredRolldownDir };
