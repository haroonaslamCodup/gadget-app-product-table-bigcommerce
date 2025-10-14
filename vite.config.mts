import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Try to import gadget plugin, but make it optional for CI
let gadget: any = null;
try {
  const gadgetModule = await import("gadget-server/vite");
  gadget = gadgetModule.gadget;
} catch (e) {
  console.log("⚠️  Running without Gadget plugin (CI mode)");
}

export default defineConfig({
  plugins: [gadget ? gadget() : null, react()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./web"),
    },
  },
});