import type { RouteContext } from "gadget-server";

/**
 * GET /api/connection-status
 *
 * Checks the BigCommerce connection status and provides diagnostics
 */
export default async function route({ reply, logger, connections, api }: RouteContext) {
    try {
        logger.info("Checking BigCommerce connection status");

        const status = {
            hasConnection: false,
            hasCurrentConnection: false,
            storeFound: false,
            credentialsValid: false,
            scopes: [] as string[],
            requiredScopes: ['store_v2_content', 'store_storefront_api', 'store_themes_manage'],
            storeHash: null as string | null,
            error: null as string | null
        };

        // Check if BigCommerce connection is available
        status.hasConnection = !!connections.bigcommerce;
        status.hasCurrentConnection = !!connections.bigcommerce?.current;

        if (!status.hasConnection) {
            status.error = "BigCommerce connection not configured";
            return reply.code(200).send(status);
        }

        // Try to get store from database (internal first, then public as a fallback)
        try {
            let store = await api.internal.bigcommerce.store.findFirst();
            if (!store) {
                logger.warn("No store found via internal API; attempting public API read");
                try {
                    store = await (api as any).bigcommerce.store.findFirst();
                } catch (publicError) {
                    logger.warn(`Public store read also failed: ${(publicError as Error).message}`);
                }
            }

            if (store) {
                status.storeFound = true;
                status.storeHash = (store as any).storeHash || null;
                status.scopes = Array.isArray((store as any).scopes) ? (store as any).scopes as string[] : [];

                // Prefer a store-scoped connection when a store is found
                try {
                    const testConnection = connections.bigcommerce.forStore(store as any);
                    if (testConnection) {
                        await testConnection.v2.get('/store' as any);
                        status.credentialsValid = true;
                        logger.info("BigCommerce connection is valid");
                    }
                } catch (connectionError) {
                    const errorMessage = (connectionError as Error).message;
                    logger.warn(`Connection test failed: ${errorMessage}`);
                    if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
                        logger.warn("Connection test failed due to authentication issue");
                        status.error = `Authentication issue: ${errorMessage}`;
                    } else {
                        status.error = `Connection test failed: ${errorMessage}`;
                    }
                }
            } else {
                // If we can't find a store record but there is a current connection, use it for validation
                if (connections.bigcommerce?.current) {
                    status.storeFound = true; // Treat as present since connection exists
                    try {
                        await connections.bigcommerce.current.v2.get('/store' as any);
                        status.credentialsValid = true;
                        logger.info("BigCommerce connection valid via current connection");
                    } catch (connectionError) {
                        const errorMessage = (connectionError as Error).message;
                        logger.warn(`Current connection test failed: ${errorMessage}`);
                        if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
                            status.error = `Authentication issue: ${errorMessage}`;
                        } else {
                            status.error = `Connection test failed: ${errorMessage}`;
                        }
                    }
                } else {
                    status.error = "No store found in database";
                }
            }
        } catch (dbError) {
            status.error = `Database error: ${(dbError as Error).message}`;
            logger.error(`Database error: ${(dbError as Error).message}`);
        }

        return reply.code(200).send(status);

    } catch (error) {
        const err = error as Error;
        logger.error(`Error checking connection status: ${err.message}`);
        return reply.code(500).send({
            error: err.message || "Unknown error occurred"
        });
    }
}


