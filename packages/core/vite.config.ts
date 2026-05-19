/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import dts from "vite-plugin-dts";
import path from "node:path";

export default defineConfig({
  plugins: [dts({ tsconfigPath: "tsconfig.build.json" })],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [],
    },
    sourcemap: true,
  },
  test: {
    name: "@goodie-forms/core",
    typecheck: {
      enabled: true,
    },
    coverage: {
      provider: "v8",
    },
    alias: {
      "@goodie-forms/core": path.resolve(__dirname, "../core/src"),
    },
  },
});
