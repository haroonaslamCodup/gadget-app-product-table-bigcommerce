import type { RouteContext } from "gadget-server";

/**
 * POST /api/cleanup-widget-templates
 *
 * Deletes all Product Table Widget templates from BigCommerce Page Builder
 * Useful for cleaning up old or duplicate widget templates
 */
export default async function route({ reply, logger, connections, api }: RouteContext) {
  try {
    logger.info("Starting widget template cleanup");

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

    // Fetch all widget templates
    let templates: any;
    try {
      templates = await bigcommerceConnection.v3.get('/content/widget-templates') as any;
      logger.info(`Raw templates response: ${JSON.stringify(templates)}`);
      logger.info(`Templates data: ${JSON.stringify(templates?.data)}`);
      logger.info(`Found ${templates?.data?.length || 0} widget templates`);

      // Check if response structure is different
      if (!templates?.data && templates) {
        logger.warn(`Templates response doesn't have 'data' property. Full response structure: ${Object.keys(templates)}`);
        // Maybe templates IS the array
        if (Array.isArray(templates)) {
          logger.info("Templates response is directly an array");
          templates = { data: templates };
        }
      }
    } catch (getError) {
      const errorMessage = (getError as Error).message;
      logger.error(`Could not fetch widget templates: ${errorMessage}`);
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

    // Find all Product Table Widget templates
    const productTableTemplates = templates?.data?.filter((template: any) =>
      template.name?.includes("Product Table Widget") ||
      template.name?.includes("Product Table")
    ) || [];

    if (productTableTemplates.length === 0) {
      logger.info("No Product Table Widget templates found");
      return reply.code(200).send({
        success: true,
        message: "No Product Table Widget templates found to delete",
        deletedCount: 0
      });
    }

    logger.info(`Found ${productTableTemplates.length} Product Table Widget templates to delete`);

    // Delete each template
    const deletionResults = [];
    for (const template of productTableTemplates) {
      try {
        await bigcommerceConnection.v3.delete(`/content/widget-templates/${template.uuid}` as any);
        logger.info(`Deleted widget template: ${template.name} (${template.uuid})`);
        deletionResults.push({
          success: true,
          uuid: template.uuid,
          name: template.name
        });
      } catch (deleteError) {
        const errorMessage = (deleteError as Error).message;
        logger.error(`Failed to delete template ${template.uuid}: ${errorMessage}`);
        deletionResults.push({
          success: false,
          uuid: template.uuid,
          name: template.name,
          error: errorMessage
        });
      }
    }

    const successCount = deletionResults.filter(r => r.success).length;
    const failureCount = deletionResults.filter(r => !r.success).length;

    return reply.code(200).send({
      success: true,
      message: `Deleted ${successCount} widget template(s). ${failureCount > 0 ? `Failed to delete ${failureCount}.` : ''}`,
      deletedCount: successCount,
      failedCount: failureCount,
      results: deletionResults
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error during widget template cleanup: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unknown error occurred"
    });
  }
}
