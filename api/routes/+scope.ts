import type { Server } from "gadget-server";

/**
 * Route Scope Plugin
 *
 * This file configures CORS settings for all routes in the api/routes directory.
 * Gadget automatically loads +scope.ts files to apply middleware to a folder of routes.
 */
export default async function (server: Server) {
  // Configure CORS for all routes in this scope
  server.setScopeCORS({
    // Allow all origins for widget access from BigCommerce storefronts
    origin: true, // Accepts all origins
    credentials: false, // Required when allowing all origins
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Api-Key",
      "X-Gadget-Request",
      "X-Gadget-Action",
      "X-Shopify-Access-Token",
      "X-BigCommerce-Access-Token",
      "X-Forwarded-For",
      "X-Real-IP"
    ],
    exposedHeaders: [
      "Access-Control-Allow-Origin",
      "Access-Control-Expose-Headers",
      "Content-Range",
      "X-Content-Range",
      "X-Total-Count",
      "Link"
    ],
    maxAge: 86400, // Cache preflight requests for 24 hours
  });
}
