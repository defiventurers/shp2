import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // Frontend root
  root: path.resolve(__dirname, "client"),

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
    },
  },

  build: {
    // Output relative to root
    outDir: "dist",
    emptyOutDir: true,
  },

  server: {
    fs: {
      strict: true,
    },
  },
});