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
        const store = await api.internal.bigcommerce.store.findFirst();
        if (store) {
          logger.info(`Found store in database: ${store.storeHash || store.id}`);

          // Create a connection scoped to the found store to ensure credentials are applied
          bigcommerceConnection = connections.bigcommerce.forStore(store);

          if (bigcommerceConnection) {
            try {
              // Test the connection by making a simple API call
              await bigcommerceConnection.v2.get('/store' as any);
              logger.info("Current connection established successfully with valid credentials");
            } catch (testError) {
              const errorMessage = (testError as Error).message;
              logger.warn(`Connection test failed: ${errorMessage}`);

              // If the current connection exists but doesn't work, we'll handle it below
            }
          } else {
            logger.warn("No current connection available even though store exists in database");
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
          data-product-table-widget='{"widgetId":"{{widget_id}}","showSearch":{{#if show_search}}true{{else}}false{{/if}},"showViewSwitcher":{{#if show_view_switcher}}true{{else}}false{{/if}}}'
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
                  default: ""
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
                  type: "code",
                  label: "Custom CSS",
                  id: "custom_css",
                  default: "",
                  // Some stores may not support "code"; if not, it will render as a textarea
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
      const errorMessage = apiErr?.message || JSON.stringify(apiErr);
      logger.warn(`Widget Templates API error: ${errorMessage}`);

      // Check if this is an authentication error
      if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
        logger.error("Access token is required during widget template installation - authentication has failed");
        return reply.code(200).send({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "The app needs to be reinstalled to refresh authentication credentials.",
          instructions: [
            "The BigCommerce connection has expired or is invalid.",
            "To fix this issue:",
            "",
            "1. Go to BigCommerce Admin → Apps & Customizations → My Apps",
            "2. Find 'Product Table Widget' app",
            "3. Click 'Uninstall' to remove the app completely",
            "4. Reinstall the app from the BigCommerce marketplace",
            "5. Make sure to approve all permission requests during installation",
            "",
            "This will refresh the authentication and restore full functionality.",
            "",
            "If you continue to have issues, you can add widgets manually:",
            "1. Go to BigCommerce Page Builder",
            "2. Add an 'HTML' widget to your page",
            "3. Paste this code:",
            `<div id="product-table-{WIDGET_ID}" class="product-table-widget" data-product-table-widget='{"widgetId":"{WIDGET_ID}"}'><div class="loading">Loading...</div></div>`,
            "4. Replace {WIDGET_ID} with your actual widget ID"
          ]
        });
      }

      // Widget Templates API might not be available on all plans or might fail for other reasons
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
