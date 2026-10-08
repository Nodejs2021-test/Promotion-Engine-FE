import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const API = process.env.VITE_API_TARGET || "http://127.0.0.1:8000";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: 5173,
    // Allow public tunnel hosts (ngrok) to reach the dev server.
    allowedHosts: [".ngrok-free.app", ".ngrok-free.dev", ".ngrok.app"],
    proxy: {
      "/api": { target: API, changeOrigin: true },
      "/docs": { target: API, changeOrigin: true },
      "/openapi.json": { target: API, changeOrigin: true },
    },
  },
});
