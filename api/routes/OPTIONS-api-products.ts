import type { RouteContext } from "gadget-server";

/**
 * Route: OPTIONS /api/products
 * Handles CORS preflight requests
 */
export default async function route({ reply }: RouteContext) {
  return reply
    .code(204)
    .header("Access-Control-Allow-Origin", "*")
    .header("Access-Control-Allow-Methods", "GET, OPTIONS")
    .header("Access-Control-Allow-Headers", "Content-Type")
    .header("Access-Control-Max-Age", "86400") // Cache preflight for 24 hours
    .send();
}
