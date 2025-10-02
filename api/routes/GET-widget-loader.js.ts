import type { RouteContext } from "gadget-server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * GET /widget-loader.js
 *
 * Serves the compiled widget bundle that BigCommerce can load.
 */
export default async function route({ reply }: RouteContext) {
    try {
        // Read the compiled widget bundle
        const widgetPath = join(process.cwd(), "web/dist/widget/widget-loader.js");
        const widgetCode = await readFile(widgetPath, "utf-8");

        reply
            .type("application/javascript; charset=utf-8")
            .header("Access-Control-Allow-Origin", "*")
            .header("Cross-Origin-Resource-Policy", "cross-origin")
            .header("X-Content-Type-Options", "nosniff")
            .header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
            .send(widgetCode);
    } catch (error) {
        console.error("Failed to load widget bundle:", error);
        reply
            .code(500)
            .type("application/javascript")
            .send("console.error('Widget bundle not found. Please run: npm run build:widget');");
    }
}


