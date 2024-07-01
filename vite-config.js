// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  base: "/Digital-Ideation/24FS/DEWEB/project/", // Ensure this matches your GitHub Pages URL structure
  server: {
    open: true,
  },
  build: {
    outDir: "dist",
  },
});
