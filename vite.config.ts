import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  // 👇 Frontend lives inside /client
  root: path.resolve(__dirname, "client"),

  // 👇 REQUIRED for Vercel (fixes white screen)
  base: "/",

  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
  },

  build: {
    // 👇 Output goes to repo-root/dist
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },

  server: {
    fs: {
      strict: true,
    },
  },
});