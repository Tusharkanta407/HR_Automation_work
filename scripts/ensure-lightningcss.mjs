#!/usr/bin/env node
/**
 * Ensures lightningcss native binary exists on Linux CI (Vercel).
 * Optional OS-specific packages are often skipped in npm workspaces installs.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webPkg = path.join(root, "apps/web/package.json");
const requireWeb = createRequire(webPkg);

function canLoad() {
  try {
    requireWeb("lightningcss");
    return true;
  } catch (err) {
    console.log("[ensure-lightningcss]", err?.message ?? err);
    return false;
  }
}

if (process.platform !== "linux") {
  console.log("[ensure-lightningcss] skip (not linux)");
  process.exit(0);
}

if (canLoad()) {
  console.log("[ensure-lightningcss] ok");
  process.exit(0);
}

console.log("[ensure-lightningcss] force-installing lightningcss-linux-x64-gnu@1.32.0 …");
execSync("npm install lightningcss-linux-x64-gnu@1.32.0 -w web --include=optional --no-fund", {
  cwd: root,
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_optional: "true",
    npm_config_omit: "",
  },
});

execSync("npm install lightningcss-linux-x64-gnu@1.32.0 --include=optional --no-fund", {
  cwd: path.join(root, "apps/web"),
  stdio: "inherit",
  env: {
    ...process.env,
    npm_config_optional: "true",
    npm_config_omit: "",
  },
});

if (!canLoad()) {
  console.error("[ensure-lightningcss] FAILED — lightningcss still unloadable");
  process.exit(1);
}

console.log("[ensure-lightningcss] ok after install");
