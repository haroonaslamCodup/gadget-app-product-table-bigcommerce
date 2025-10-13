import type { RouteContext } from "gadget-server";

/**
 * POST /api/install-category-widget
 *
 * Installs the product table widget globally on all category pages
 * using BigCommerce Widgets API
 *
 * Body params:
 * - productTableId: The ID of the product table to install
 */
export default async function route({ request, reply, logger, connections, api }: RouteContext) {
  try {
    const body = request.body as Record<string, any>;
    const { productTableId } = body;

    if (!productTableId) {
      return reply.code(400).send({
        success: false,
        error: "productTableId is required"
      });
    }

    // Get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;
    try {
      const store = await api.internal.bigcommerce.store.findFirst();
      if (store) bigcommerceConnection = connections.bigcommerce.forStore(store);
    } catch (e) {
      logger.warn(`Store lookup failed: ${(e as Error).message}`);
    }

    if (!bigcommerceConnection) {
      return reply.code(500).send({
        success: false,
        error: "BigCommerce connection not available"
      });
    }

    logger.info(`Installing product table widget ${productTableId} on all category pages`);

    // Step 1: Check if widget template already exists
    let widgetTemplateUuid: string | undefined;

    try {
      const templates = await bigcommerceConnection.v3.get('/content/widget-templates') as any;
      const existingTemplate = templates?.data?.find((t: any) =>
        t.name === 'Product Table Widget Template'
      );

      if (existingTemplate) {
        widgetTemplateUuid = existingTemplate.uuid;
        logger.info(`Found existing widget template: ${widgetTemplateUuid}`);
      }
    } catch (e) {
      logger.warn(`Could not fetch widget templates: ${(e as Error).message}`);
    }

    // Step 2: Create widget template if it doesn't exist
    if (!widgetTemplateUuid) {
      try {
        const templateData = {
          name: 'Product Table Widget Template',
          schema: [] as const,
          template: `<div data-product-table-widget="${productTableId}"></div>`
        };

        const createResponse = await bigcommerceConnection.v3.post(
          '/content/widget-templates',
          { body: templateData }
        ) as any;

        widgetTemplateUuid = createResponse?.data?.uuid;
        logger.info(`Created widget template: ${widgetTemplateUuid}`);
      } catch (e) {
        logger.error(`Failed to create widget template: ${(e as Error).message}`);
        return reply.code(500).send({
          success: false,
          error: "Failed to create widget template",
          details: (e as Error).message
        });
      }
    }

    if (!widgetTemplateUuid) {
      return reply.code(500).send({
        success: false,
        error: "Could not get or create widget template"
      });
    }

    // Step 3: Create widget instance
    let widgetUuid: string | undefined;

    try {
      const widgetData = {
        name: 'Product Table Widget',
        widget_template_uuid: widgetTemplateUuid,
        widget_configuration: {
          productTableId: productTableId
        }
      };

      const widgetResponse = await bigcommerceConnection.v3.post(
        '/content/widgets',
        { body: widgetData }
      ) as any;

      widgetUuid = widgetResponse?.data?.uuid;
      logger.info(`Created widget instance: ${widgetUuid}`);
    } catch (e) {
      logger.error(`Failed to create widget: ${(e as Error).message}`);
      return reply.code(500).send({
        success: false,
        error: "Failed to create widget",
        details: (e as Error).message
      });
    }

    if (!widgetUuid) {
      return reply.code(500).send({
        success: false,
        error: "Could not create widget instance"
      });
    }

    // Step 4: Place widget on category page template
    try {
      const placementData = {
        widget_uuid: widgetUuid,
        entity_id: '', // Empty for global placement
        sort_order: 1,
        region: 'category_below_header', // Place below category header
        template_file: 'pages/category',
        status: 'active' as const
      };

      const placementResponse = await bigcommerceConnection.v3.post(
        '/content/placements',
        { body: placementData }
      ) as any;

      logger.info(`Widget placed successfully: ${JSON.stringify(placementResponse?.data)}`);

      return reply.code(200).send({
        success: true,
        message: "Widget installed globally on all category pages",
        widgetTemplateUuid,
        widgetUuid,
        placementUuid: placementResponse?.data?.uuid
      });
    } catch (e) {
      logger.error(`Failed to place widget: ${(e as Error).message}`);
      return reply.code(500).send({
        success: false,
        error: "Failed to place widget on category pages",
        details: (e as Error).message,
        widgetUuid // Return this so user can manually place it
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error installing category widget: ${err.message}`);
    return reply.code(500).send({
      success: false,
      error: "Internal server error",
      message: err.message
    });
  }
}
