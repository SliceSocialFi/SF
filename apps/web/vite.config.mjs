import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import EnvironmentPlugin from "vite-plugin-environment";
import tsconfigPaths from "vite-tsconfig-paths";

const dependenciesToChunk = {
  aws: ["@aws-sdk/client-s3", "@aws-sdk/lib-storage"],
  editor: [
    "react-markdown",
    "unified",
    "rehype-parse",
    "rehype-remark",
    "remark-breaks",
    "remark-html",
    "remark-linkify-regex",
    "remark-stringify",
    "strip-markdown"
  ],
  indexer: ["@slice/indexer"],
  media: ["plyr-react", "@livepeer/react", "browser-image-compression"],
  misc: [
    "@lens-chain/storage-client",
    "@lens-protocol/metadata",
    "@apollo/client",
    "zustand",
    "tailwind-merge",
    "virtua",
    "zod"
  ],
  prosekit: ["prosekit", "prosekit/core", "prosekit/react"],
  react: [
    "react",
    "react-dom",
    "react-easy-crop",
    "react-hook-form",
    "react-router",
    "react-tracked"
  ],
  ui: [
    "@headlessui/react",
    "@radix-ui/react-hover-card",
    "@radix-ui/react-slider",
    "@radix-ui/react-tooltip",
    "@uidotdev/usehooks",
    "sonner",
    "motion",
    "motion-plus-react"
  ],
  wevm: ["wagmi", "family", "viem", "viem/zksync"]
};

export default defineConfig({
  build: {
    cssMinify: "lightningcss",
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (/\.woff2$/.test(assetInfo.name ?? "")) {
            return "assets/fonts/[name][extname]";
          }

          return "assets/[name]-[hash][extname]";
        },
        manualChunks: dependenciesToChunk
      }
    },
    sourcemap: true,
    target: "esnext"
  },
  plugins: [
    tsconfigPaths(),
    react(),
    tailwindcss(),
    // Expose env vars to client-side code (process.env.*)
    // Provide a safe default for SLICE_API_URL to avoid build-time errors.
    EnvironmentPlugin({
      SLICE_API_URL: process.env.SLICE_API_URL ?? "https://slice-api-indol.vercel.app/",
      LENS_NETWORK: process.env.LENS_NETWORK ?? "testnet",
      BRIDGE_API_URL: process.env.BRIDGE_API_URL ?? "http://localhost:8787/"
    })
  ],
server: {
    port: Number(process.env.PORT) || 5173,
    proxy: {
      // tất cả request tới /api/* được proxy tới slice-api (removes CORS issues in dev)
      '/api': {
        target: 'https://slice-api-indol.vercel.app',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
