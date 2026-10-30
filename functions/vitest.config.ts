import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: { GCLOUD_PROJECT: "demo-fyt" },
    testTimeout: 20_000,
  },
});
