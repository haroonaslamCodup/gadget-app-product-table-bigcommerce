import type { RouteHandler } from "gadget-server";

/**
 * Route handler for GET /api/widgets/list
 * Returns a list of active widgets for Page Builder dropdown
 */
const route: RouteHandler = async ({ request, reply, api, logger, connections }) => {
  try {
    // Get store from session
    const storeId = connections.bigcommerce?.currentStoreId;

    if (!storeId) {
      return reply.code(401).send({
        success: false,
        error: "Store not identified",
      });
    }

    // Fetch all active widgets for this store
    const widgets = await api.widgetInstance.findMany({
      filter: {
        store: { id: { equals: storeId } },
        isActive: { equals: true },
      },
      select: {
        id: true,
        widgetId: true,
        widgetName: true,
        placementLocation: true,
        displayFormat: true,
      },
    });

    // Format for Page Builder dropdown
    const widgetOptions = widgets.map((widget) => ({
      label: widget.widgetName || `Widget ${widget.widgetId}`,
      value: widget.widgetId,
      caption: `${widget.displayFormat || 'standard'} - ${widget.placementLocation || 'any'}`,
    }));

    reply.code(200).send({
      success: true,
      widgets: widgetOptions,
    });
  } catch (error) {
    logger.error({ error }, "Error fetching widgets list");
    reply.code(500).send({
      success: false,
      error: "Failed to fetch widgets",
    });
  }
};

export default route;
