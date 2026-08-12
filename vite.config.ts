import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Strip all console.* and debugger statements in production.
    // Development builds keep them so you can still debug locally.
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    // Raise warning threshold slightly — we'll bring it down with WebP assets.
    chunkSizeWarningLimit: 600,
  },
}));
