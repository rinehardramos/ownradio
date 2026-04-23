#!/usr/bin/env tsx
/**
 * Version string generator.
 * Outputs: v<semver>+<short-sha>  (e.g. v1.0.0+abc1234)
 *
 * Usage:
 *   npx tsx scripts/version.ts          # print current version
 *   npx tsx scripts/version.ts --bump   # increment patch, write to package.json, print
 */

import { execSync } from "child_process";
import { readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PKG_PATH = join(ROOT, "package.json");

function getShortSha(): string {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT, encoding: "utf-8" }).trim();
  } catch {
    return "unknown";
  }
}

function readVersion(): string {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  return pkg.version as string;
}

function bumpPatch(version: string): string {
  const parts = version.split(".");
  parts[2] = String(Number(parts[2]) + 1);
  return parts.join(".");
}

function writeVersion(version: string): void {
  const pkg = JSON.parse(readFileSync(PKG_PATH, "utf-8"));
  pkg.version = version;
  writeFileSync(PKG_PATH, JSON.stringify(pkg, null, 2) + "\n");
}

let version = readVersion();

if (process.argv.includes("--bump")) {
  version = bumpPatch(version);
  writeVersion(version);
}

const sha = getShortSha();
const tag = `v${version}+${sha}`;

process.stdout.write(tag);
