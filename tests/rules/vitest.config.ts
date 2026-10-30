import { defineConfig } from "vitest/config";

// One emulator, shared state: run files serially.
export default defineConfig({ test: { include: ["*.test.ts"], fileParallelism: false, testTimeout: 20_000, hookTimeout: 30_000 } });
