import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  // Explicitly force Vite to output compile bundles to 'dist' directory
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
