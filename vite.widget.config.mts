import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Separate build config for the BigCommerce storefront widget
export default defineConfig({
  plugins: [react()],
  define: {
    // Define process and process.env for browser bundle
    'process.env.NODE_ENV': JSON.stringify('production'),
    'process': JSON.stringify({
      env: { NODE_ENV: 'production' },
      emit: () => {},
    }),
  },
  build: {
    // Output to a dist folder that can be served
    outDir: "web/dist/widget",
    emptyOutDir: true,
    lib: {
      entry: path.resolve(__dirname, "web/storefront/widget-loader.tsx"),
      name: "ProductTableWidget",
      formats: ["iife"],
      fileName: () => "widget-loader.js",
    },
    rollupOptions: {
      // Externalize peer dependencies that should be loaded separately
      external: [],
      output: {
        globals: {},
        // Inline all dependencies into a single bundle
        inlineDynamicImports: true,
      },
    },
    // Ensure the bundle is production-ready
    minify: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
    },
  },
});
