import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import fs from "fs";

export default defineConfig({
  plugins: [
    react(),
    {
      name: "copy-extension-files",
      apply: "build",
      enforce: "post",
      writeBundle() {
        const distDir = "dist/extension";

        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest
        if (fs.existsSync("public/manifest.json")) {
          fs.copyFileSync("public/manifest.json", `${distDir}/manifest.json`);
          console.log("✓ manifest.json");
        }

        // Copy popup HTML
        if (fs.existsSync("client/extension/popup.html")) {
          fs.copyFileSync(
            "client/extension/popup.html",
            `${distDir}/popup.html`,
          );
          console.log("✓ popup.html");
        }

        // Copy sidebar HTML
        if (fs.existsSync("client/extension/sidebar.html")) {
          fs.copyFileSync(
            "client/extension/sidebar.html",
            `${distDir}/sidebar.html`,
          );
          console.log("✓ sidebar.html");
        }

        // Copy PNG icons
        for (const size of [16, 48, 128]) {
          const iconFile = `public/icon-${size}.png`;
          if (fs.existsSync(iconFile)) {
            fs.copyFileSync(iconFile, `${distDir}/icon-${size}.png`);
            console.log(`✓ icon-${size}.png`);
          }
        }
      },
    },
  ],
  // Don't copy the web app's public/ folder into the extension output
  publicDir: false,
  // Strip console.* calls during the esbuild transform phase
  esbuild: {
    drop: ["console", "debugger"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    target: "esnext",
    outDir: "dist/extension",
    emptyOutDir: true,
    lib: {
      entry: {
        background: "client/extension/background.ts",
        content: "client/extension/content.ts",
        popup: "client/extension/popup.ts",
        sidebar: "client/extension/sidebar.ts",
      },
      formats: ["es"],
      fileName: (format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: {
        preserveModules: false,
        entryFileNames: "[name].js",
      },
    },
    minify: "esbuild",
  },
});
