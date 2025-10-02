import { readFile, stat } from "fs/promises";
import type { RouteContext } from "gadget-server";
import { join } from "path";

// Widget version - increment this when you rebuild the widget to bust cache
const WIDGET_VERSION = "1.0.11";

/**
 * GET /widget-loader.js
 *
 * Serves the compiled widget bundle that BigCommerce can load.
 * Supports cache busting via version query parameter (?v=1.0.11)
 */
export default async function route({ reply }: RouteContext) {
    try {
        // Read the compiled widget bundle
        const widgetPath = join(process.cwd(), "web/dist/widget/widget-loader.js");
        const widgetCode = await readFile(widgetPath, "utf-8");

        // Get file modification time for ETag
        const fileStats = await stat(widgetPath);
        const lastModified = fileStats.mtime.toUTCString();
        const etag = `"${fileStats.mtime.getTime()}-${fileStats.size}"`;

        reply
            .type("application/javascript; charset=utf-8")
            .header("Cross-Origin-Resource-Policy", "cross-origin")
            .header("X-Content-Type-Options", "nosniff")
            .header("Cache-Control", "public, max-age=86400, must-revalidate") // Cache for 24 hours but revalidate
            .header("ETag", etag)
            .header("Last-Modified", lastModified)
            .header("X-Widget-Version", WIDGET_VERSION)
            .send(widgetCode);
    } catch (error) {
        console.error("Failed to load widget bundle:", error);
        reply
            .code(500)
            .type("application/javascript")
            .send("console.error('Widget bundle not found. Please run: npm run build:widget');");
    }
}
