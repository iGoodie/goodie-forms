import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@goodie-forms/core": path.resolve(__dirname, "../core/src"),
      "@goodie-forms/react": path.resolve(__dirname, "../react/src"),
    },
  },

  server: {
    fs: {
      allow: [
        "..", // allow monorepo root
      ],
    },
  },

  optimizeDeps: {
    exclude: ["@goodie-forms/core", "@goodie-forms/react"],
  },
});
