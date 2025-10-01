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

        // Try to get store from database
        try {
            const store = await api.bigcommerce.store.findFirst();
            if (store) {
                status.storeFound = true;
                status.storeHash = store.storeHash || null;
                status.scopes = Array.isArray(store.scopes) ? store.scopes as string[] : [];

                // Try to create a connection and test it
                try {
                    const testConnection = connections.bigcommerce.forStore(store);
                    if (testConnection) {
                        // Test the connection with a simple API call
                        await testConnection.v2.get('/store' as any);
                        status.credentialsValid = true;
                        logger.info("BigCommerce connection is valid");
                    }
                } catch (connectionError) {
                    status.error = `Connection test failed: ${(connectionError as Error).message}`;
                    logger.warn(`Connection test failed: ${(connectionError as Error).message}`);
                }
            } else {
                status.error = "No store found in database";
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