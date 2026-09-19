#!/usr/bin/env node
/**
 * Vercel/Linux CI: npm workspaces often drop platform optional natives
 * (@tailwindcss/oxide-*, lightningcss-*). Force-install what the build needs.
 */
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const webDir = path.join(root, "apps/web");
const requireWeb = createRequire(path.join(webDir, "package.json"));

function tryRequire(id) {
  try {
    requireWeb(id);
    return true;
  } catch (err) {
    console.log(`[ensure-natives] missing ${id}:`, err?.message ?? err);
    return false;
  }
}

function npmInstall(pkgs, cwd = root) {
  const list = pkgs.join(" ");
  console.log(`[ensure-natives] npm install ${list} (cwd=${cwd})`);
  execSync(`npm install ${list} --include=optional --no-fund --no-audit`, {
    cwd,
    stdio: "inherit",
    env: {
      ...process.env,
      npm_config_optional: "true",
      npm_config_omit: "",
    },
  });
}

if (process.platform !== "linux") {
  console.log("[ensure-natives] skip (not linux)");
  process.exit(0);
}

const need = [
  "lightningcss",
  "@tailwindcss/oxide",
  "@tailwindcss/oxide-linux-x64-gnu",
  "lightningcss-linux-x64-gnu",
];

const missing = need.filter((id) => !tryRequire(id));
if (missing.length === 0) {
  console.log("[ensure-natives] ok");
  process.exit(0);
}

npmInstall(
  [
    "lightningcss@1.32.0",
    "lightningcss-linux-x64-gnu@1.32.0",
    "@tailwindcss/oxide@4.3.3",
    "@tailwindcss/oxide-linux-x64-gnu@4.3.3",
  ],
  root,
);

// Install again inside apps/web so require resolves from workspace node_modules
npmInstall(
  [
    "lightningcss@1.32.0",
    "lightningcss-linux-x64-gnu@1.32.0",
    "@tailwindcss/oxide@4.3.3",
    "@tailwindcss/oxide-linux-x64-gnu@4.3.3",
  ],
  webDir,
);

const stillBad = ["lightningcss", "@tailwindcss/oxide"].filter((id) => !tryRequire(id));
if (stillBad.length) {
  console.error("[ensure-natives] FAILED:", stillBad.join(", "));
  process.exit(1);
}

console.log("[ensure-natives] ok after install");
