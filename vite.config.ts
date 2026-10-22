import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `npm run build` → normal multi-file build in dist/
// `npm run build:single` → one self-contained HTML file in dist-single/ (used for the shareable preview)
export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  resolve: { alias: { "@": "/src" } },
  build: {
    outDir: mode === "single" ? "dist-single" : "dist",
    chunkSizeWarningLimit: 1500,
  },
}));
