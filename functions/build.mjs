/**
 * Bundles src/index.ts into dist/index.js with esbuild and writes
 * dist/package.json. Firebase deploys a single directory, so workspace code
 * (@fyt/domain) is inlined and only real npm dependencies stay external.
 *
 *   node build.mjs           one-off build
 *   node build.mjs --watch   rebuild on change (use with the emulator)
 */
import { build, context } from "esbuild";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const pkg = JSON.parse(await readFile(new URL("./package.json", import.meta.url), "utf8"));
const runtimeDeps = Object.keys(pkg.dependencies).filter((d) => !d.startsWith("@fyt/"));

// Exact versions of what is installed, so the deployed function runs what was tested.
const pinned = {};
for (const dep of runtimeDeps) {
  // Walk up node_modules like Node does (workspaces hoist to the repo root).
  let dir = process.cwd();
  let file = "";
  while (!existsSync((file = path.join(dir, "node_modules", dep, "package.json")))) {
    const up = path.dirname(dir);
    if (up === dir) throw new Error(`Cannot find ${dep}; run npm install at the repo root.`);
    dir = up;
  }
  pinned[dep] = JSON.parse(await readFile(file, "utf8")).version;
}

/** @type {import("esbuild").BuildOptions} */
const options = {
  entryPoints: ["src/index.ts"],
  outfile: "dist/index.js",
  bundle: true,
  platform: "node",
  target: "node24",
  format: "cjs",
  sourcemap: true,
  external: runtimeDeps,
  logLevel: "info",
};

await mkdir("dist", { recursive: true });
await writeFile(
  "dist/package.json",
  JSON.stringify({ name: "fyt-functions", private: true, main: "index.js", engines: { node: "24" }, dependencies: pinned }, null, 2) + "\n",
);

if (process.argv.includes("--watch")) {
  const ctx = await context(options);
  await ctx.watch();
} else {
  await build(options);
}
