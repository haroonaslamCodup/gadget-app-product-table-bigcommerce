import type { RouteContext } from "gadget-server";

/**
 * GET /api/list-widgets
 *
 * Lists all widget templates, scripts, and placements for debugging
 */
export default async function route({ reply, logger, connections, api }: RouteContext) {
  try {
    // Try to get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;

    if (!bigcommerceConnection) {
      try {
        const store = await api.internal.bigcommerce.store.findFirst();
        if (store) {
          bigcommerceConnection = connections.bigcommerce.forStore(store);
        }
      } catch (err) {
        logger.error(`Error fetching store: ${(err as Error).message}`);
      }
    }

    if (!bigcommerceConnection) {
      return reply.code(200).send({
        success: false,
        error: "NO_CONNECTION",
        message: "No BigCommerce connection available"
      });
    }

    const result: any = {
      templates: [],
      scripts: [],
      placements: [],
      widgets: []
    };

    // Get widget templates
    try {
      const templates = await bigcommerceConnection.v3.get('/content/widget-templates') as any;
      result.templates = templates?.data || [];
      logger.info(`Found ${result.templates.length} widget templates`);
    } catch (error) {
      logger.warn(`Could not fetch widget templates: ${(error as Error).message}`);
      result.templatesError = (error as Error).message;
    }

    // Get scripts
    try {
      const scripts = await bigcommerceConnection.v3.get('/content/scripts') as any;
      result.scripts = scripts?.data || [];
      logger.info(`Found ${result.scripts.length} scripts`);
    } catch (error) {
      logger.warn(`Could not fetch scripts: ${(error as Error).message}`);
      result.scriptsError = (error as Error).message;
    }

    // Get widget placements
    try {
      const placements = await bigcommerceConnection.v3.get('/content/placements') as any;
      result.placements = placements?.data || [];
      logger.info(`Found ${result.placements.length} widget placements`);
    } catch (error) {
      logger.warn(`Could not fetch widget placements: ${(error as Error).message}`);
      result.placementsError = (error as Error).message;
    }

    // Get widgets
    try {
      const widgets = await bigcommerceConnection.v3.get('/content/widgets') as any;
      result.widgets = widgets?.data || [];
      logger.info(`Found ${result.widgets.length} widgets`);
    } catch (error) {
      logger.warn(`Could not fetch widgets: ${(error as Error).message}`);
      result.widgetsError = (error as Error).message;
    }

    return reply.code(200).send({
      success: true,
      data: result
    });

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error listing widgets: ${err.message}`);
    return reply.code(500).send({
      success: false,
      error: err.message
    });
  }
}
