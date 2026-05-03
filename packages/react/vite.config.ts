/// <reference types="vitest/config" />

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

export default defineConfig({
  plugins: [react(), dts({ entryRoot: "src" })],
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
    },
    coverage: {
      provider: "v8",
    },
  },
});
