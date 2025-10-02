import type { RouteContext } from "gadget-server";

/**
 * POST /api/cleanup-widget-scripts
 *
 * Deletes all Product Table Widget loader scripts from BigCommerce Script Manager
 * Useful for cleaning up old or duplicate scripts
 */
export default async function route({ reply, logger, connections, api }: RouteContext) {
  try {
    logger.info("Starting widget script cleanup");

    // Try to get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;

    if (!bigcommerceConnection) {
      logger.info("No current connection, attempting to get store from database");
      try {
        const store = await api.internal.bigcommerce.store.findFirst();
        if (store) {
          logger.info(`Found store in database: ${store.storeHash || store.id}`);
          bigcommerceConnection = connections.bigcommerce.forStore(store);

          if (bigcommerceConnection) {
            try {
              await bigcommerceConnection.v2.get('/store' as any);
              logger.info("Connection established successfully");
            } catch (testError) {
              logger.warn(`Connection test failed: ${(testError as Error).message}`);
            }
          }
        }
      } catch (err) {
        logger.error(`Error fetching store: ${(err as Error).message}`);
      }
    }

    if (!bigcommerceConnection) {
      return reply.code(200).send({
        success: false,
        error: "NO_CONNECTION",
        message: "No BigCommerce connection available. Please reinstall the app."
      });
    }

    // Fetch all scripts
    let scripts: any;
    try {
      scripts = await bigcommerceConnection.v3.get('/content/scripts') as any;
      logger.info(`Raw scripts response: ${JSON.stringify(scripts)}`);
      logger.info(`Scripts data: ${JSON.stringify(scripts?.data)}`);
      logger.info(`Found ${scripts?.data?.length || 0} scripts`);

      // Check if response structure is different
      if (!scripts?.data && scripts) {
        logger.warn(`Scripts response doesn't have 'data' property. Full response structure: ${Object.keys(scripts)}`);
        // Maybe scripts IS the array
        if (Array.isArray(scripts)) {
          logger.info("Scripts response is directly an array");
          scripts = { data: scripts };
        }
      }
    } catch (getError) {
      const errorMessage = (getError as Error).message;
      logger.error(`Could not fetch scripts: ${errorMessage}`);
      logger.error(`Error details: ${JSON.stringify(getError)}`);

      if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
        return reply.code(200).send({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "Authentication failed. Please reinstall the app."
        });
      }

      return reply.code(500).send({
        success: false,
        error: errorMessage
      });
    }

    // Log all scripts for debugging
    logger.info(`All scripts: ${JSON.stringify(scripts?.data?.map((s: any) => ({ name: s.name, uuid: s.uuid })))}`);

    // Find all Product Table Widget scripts
    const productTableScripts = scripts?.data?.filter((script: any) => {
      const matches = script.name?.includes("Product Table Widget") || script.name?.includes("Product Table");
      logger.info(`Script "${script.name}" matches: ${matches}`);
      return matches;
    }) || [];

    if (productTableScripts.length === 0) {
      logger.info("No Product Table Widget scripts found");
      return reply.code(200).send({
        success: true,
        message: "No Product Table Widget scripts found to delete",
        deletedCount: 0,
        allScripts: scripts?.data?.map((s: any) => ({ name: s.name, uuid: s.uuid }))
      });
    }

    logger.info(`Found ${productTableScripts.length} Product Table Widget scripts to delete`);

    // Delete each script
    const deletionResults = [];
    for (const script of productTableScripts) {
      try {
        logger.info(`Attempting to delete script: ${script.name} (${script.uuid})`);
        const deleteResponse = await bigcommerceConnection.v3.delete(`/content/scripts/${script.uuid}` as any);
        logger.info(`Delete response: ${JSON.stringify(deleteResponse)}`);
        logger.info(`Successfully deleted script: ${script.name} (${script.uuid})`);
        deletionResults.push({
          success: true,
          uuid: script.uuid,
          name: script.name
        });
      } catch (deleteError) {
        const errorMessage = (deleteError as Error).message;
        const errorStack = (deleteError as Error).stack;
        logger.error(`Failed to delete script ${script.uuid}: ${errorMessage}`);
        logger.error(`Error stack: ${errorStack}`);
        deletionResults.push({
          success: false,
          uuid: script.uuid,
          name: script.name,
          error: errorMessage
        });
      }
    }

    const successCount = deletionResults.filter(r => r.success).length;
    const failureCount = deletionResults.filter(r => !r.success).length;

    logger.info(`Cleanup complete: ${successCount} deleted, ${failureCount} failed`);

    return reply.code(200).send({
      success: successCount > 0 || productTableScripts.length === 0,
      message: `Deleted ${successCount} script(s). ${failureCount > 0 ? `Failed to delete ${failureCount}.` : ''}`,
      deletedCount: successCount,
      failedCount: failureCount,
      totalFound: productTableScripts.length,
      results: deletionResults
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error during script cleanup: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unknown error occurred"
    });
  }
}
