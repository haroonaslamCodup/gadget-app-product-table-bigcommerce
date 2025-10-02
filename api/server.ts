import cors from "@fastify/cors";

export default async function (server: any) {
  // Register the Fastify CORS plugin for all routes
  // For widget use case, allowing all origins but without credentials
  await server.register(cors, {
    origin: (origin: string | undefined, callback: (err: Error | null, allow: boolean) => void) => {
      // Allow requests with no origin (like server-to-server calls)
      if (!origin) {
        callback(null, true);
        return;
      }
      
      // Allow all origins for widget access from storefronts
      // In a production environment, you might want to be more specific
      // about allowed origins for security reasons
      callback(null, true);
    },
    credentials: false, // Keep as false to work with wildcard-like behavior
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
      "X-Requested-With",
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
    ]
  });
}