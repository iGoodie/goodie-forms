/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import path from "node:path";

export default defineConfig({
  plugins: [react(), dts({ tsconfigPath: "tsconfig.build.json" })],
  build: {
    lib: {
      entry: "src/index.ts",
      formats: ["es"],
      fileName: "index",
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "@goodie-forms/core",
      ],
    },
    sourcemap: true,
  },
  test: {
    name: "@goodie-forms/react",
    environment: "jsdom",
    typecheck: {
      enabled: true,
      tsconfig: "tsconfig.test.json",
    },
    coverage: {
      provider: "v8",
    },
    alias: {
      "@goodie-forms/core": path.resolve(__dirname, "../core/src"),
      "@goodie-forms/react": path.resolve(__dirname, "src"),
    },
  },
});
