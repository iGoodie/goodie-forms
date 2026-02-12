/// <reference types="vitest/config" />

import { defineConfig } from "vite";

import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [
    dts({
      entryRoot: "src",
      exclude: ["**/*.spec.ts"],
    }),
  ],
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
  },
});
