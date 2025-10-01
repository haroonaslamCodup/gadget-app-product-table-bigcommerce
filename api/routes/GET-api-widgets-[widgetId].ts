import type { RouteHandler } from "gadget-server";

/**
 * Route handler for GET /api/widgets/:widgetId
 * Returns widget configuration for storefront rendering
 * This route is public and does NOT require authentication (used on storefront)
 */
const route: RouteHandler = async ({ reply, api, logger, params }) => {
  try {
    const widgetId = params.widgetId;

    if (!widgetId) {
      return reply.code(400).send({
        success: false,
        error: "Widget ID is required",
      });
    }

    // Fetch widget by widgetId (not database ID)
    const widgets = await api.widgetInstance.findMany({
      filter: {
        widgetId: { equals: widgetId as string },
        isActive: { equals: true },
      },
      first: 1,
    });

    const widget = widgets[0] as any;

    if (!widget) {
      return reply.code(404).send({
        success: false,
        error: "Widget not found or inactive",
      });
    }

    // Return only the configuration needed for rendering
    const config = {
      widgetId: widget.widgetId,
      widgetName: widget.widgetName,
      displayFormat: widget.displayFormat,
      columns: widget.columns,
      columnsOrder: widget.columnsOrder,
      productSource: widget.productSource,
      selectedCollections: widget.selectedCollections,
      selectedCategories: widget.selectedCategories,
      targetAllCustomers: widget.targetAllCustomers,
      targetRetailOnly: widget.targetRetailOnly,
      targetWholesaleOnly: widget.targetWholesaleOnly,
      targetLoggedInOnly: widget.targetLoggedInOnly,
      targetCustomerTags: widget.targetCustomerTags,
      allowViewSwitching: widget.allowViewSwitching,
      defaultToTableView: widget.defaultToTableView,
      enableCustomerSorting: widget.enableCustomerSorting,
      defaultSort: widget.defaultSort,
      itemsPerPage: widget.itemsPerPage,
      placementLocation: widget.placementLocation,
    };

    // Set cache headers - cache for 5 minutes
    reply.header("Cache-Control", "public, max-age=300");

    reply.code(200).send({
      success: true,
      widget: config,
    });
  } catch (error: unknown) {
    logger.error({ error }, "Error fetching widget configuration");
    reply.code(500).send({
      success: false,
      error: "Failed to fetch widget configuration",
    });
  }
};

export default route;
