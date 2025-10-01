import type { RouteContext } from "gadget-server";

/**
 * POST /api/install-widget-template
 *
 * Registers the Product Table Widget with BigCommerce Page Builder
 * Called during app installation or manually to refresh widget registration
 */
export default async function route({ reply, logger, connections, request, api }: RouteContext) {
  try {
    logger.info(`Request headers: ${JSON.stringify(request.headers)}`);
    logger.info(`BigCommerce connection available: ${!!connections.bigcommerce}`);
    logger.info(`BigCommerce current: ${!!connections.bigcommerce?.current}`);

    // Try to get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;

    // If no current connection, try to get the first store and create a connection
    if (!bigcommerceConnection) {
      logger.info("No current connection, attempting to get store from database");
      try {
        const store = await api.bigcommerce.store.findFirst();
        if (store) {
          try {
            bigcommerceConnection = connections.bigcommerce.forStore(store);
            logger.info(`Found store in database: ${store.storeHash}`);
            logger.info(`Created connection for store: ${!!bigcommerceConnection}`);
          } catch (connectionError) {
            logger.warn(`Store found but unable to create connection: ${store.storeHash}`);
          }
        } else {
          logger.warn(`No store found in database`);
        }
      } catch (err) {
        logger.error(`Error fetching store: ${(err as Error).message}`);
      }
    }

    // Check if we have a BigCommerce connection
    if (!bigcommerceConnection) {
      logger.warn("No BigCommerce connection available - falling back to manual instructions");
      return reply.code(200).send({
        success: true,
        manualSetup: true,
        message: "Use the manual HTML widget method to add widgets to your pages.",
        instructions: [
          "To add a widget to any page:",
          "1. Go to BigCommerce Admin → Storefront → My Themes",
          "2. Click 'Customize' on your active theme",
          "3. Navigate to the page where you want to add the widget",
          "4. Click 'Add Widget' or drag a widget zone",
          "5. Select 'HTML' widget from the dropdown",
          "6. Paste this code (replace YOUR_WIDGET_ID):",
          "",
          '<div id="product-table-YOUR_WIDGET_ID" class="product-table-widget" data-product-table-widget=\'{"widgetId":"YOUR_WIDGET_ID"}\'><div class="loading">Loading products...</div></div>',
          "",
          "7. Replace YOUR_WIDGET_ID with the actual Widget ID from the Widgets page",
          "8. Click 'Save' and 'Publish'"
        ]
      });
    }

    // Widget template configuration
    const widgetTemplate: any = {
      name: "Product Table Widget",
      template: `
        <div
          id="product-table-{{widget_id}}"
          class="product-table-widget"
          data-product-table-widget='{"widgetId":"{{widget_id}}","showSearch":{{show_search}},"showViewSwitcher":{{show_view_switcher}}}'
        >
          <div class="loading">Loading products...</div>
        </div>
        {{#if custom_css}}
        <style>
          {{custom_css}}
        </style>
        {{/if}}
      `,
      schema: [
        {
          type: "tab",
          label: "Widget Selection",
          sections: [
            {
              label: "Widget Configuration",
              settings: [
                {
                  type: "text",
                  label: "Widget ID",
                  id: "widget_id",
                  default: "",
                  typeMeta: {
                    placeholder: "Enter widget ID from admin panel"
                  }
                }
              ]
            },
            {
              label: "Display Options",
              settings: [
                {
                  type: "boolean",
                  label: "Show Search Filter",
                  id: "show_search",
                  default: true
                },
                {
                  type: "boolean",
                  label: "Show View Switcher",
                  id: "show_view_switcher",
                  default: true
                }
              ]
            }
          ]
        },
        {
          type: "tab",
          label: "Advanced",
          sections: [
            {
              label: "Custom Styling",
              settings: [
                {
                  type: "text",
                  label: "Custom CSS",
                  id: "custom_css",
                  default: ""
                }
              ]
            }
          ]
        }
      ]
    };

    // Try to create widget template via BigCommerce API
    try {
      const response = await bigcommerceConnection.v3.post('/content/widget-templates' as any, {
        body: widgetTemplate
      }) as any;

      if (response?.uuid) {
        logger.info(`Widget template created successfully: uuid=${response.uuid}`);
        return reply.code(200).send({
          success: true,
          widgetTemplateUuid: response.uuid,
          message: "Widget template installed successfully. It should now appear in Page Builder."
        });
      }
    } catch (apiError: unknown) {
      const apiErr = apiError as any;
      logger.warn(`Widget Templates API error: ${apiErr?.message || JSON.stringify(apiErr)}`);

      // Widget Templates API might not be available on all plans
      // Return success with instructions for manual setup
      return reply.code(200).send({
        success: true,
        manualSetup: true,
        message: "Widget Templates API is not available on your plan. Please use the manual HTML widget method instead.",
        instructions: [
          "1. Go to BigCommerce Page Builder",
          "2. Add an 'HTML' widget to your page",
          "3. Paste this code:",
          `<div id="product-table-{WIDGET_ID}" class="product-table-widget" data-product-table-widget='{"widgetId":"{WIDGET_ID}"}'><div class="loading">Loading...</div></div>`,
          "4. Replace {WIDGET_ID} with your actual widget ID"
        ]
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error installing widget template: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unknown error occurred"
    });
  }
}
