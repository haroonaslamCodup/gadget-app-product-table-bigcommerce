import type { RouteContext } from "gadget-server";

/**
 * POST /api/inject-widget-script
 *
 * Injects the widget loader script into the BigCommerce storefront
 * This makes the widget functional on all pages
 */
export default async function route({ reply, logger, connections, request, api }: RouteContext) {
  try {
    logger.info(`Request headers: ${JSON.stringify(request.headers)}`);
    logger.info(`BigCommerce connection available: ${!!connections.bigcommerce}`);
    logger.info(`BigCommerce current: ${!!connections.bigcommerce?.current}`);

    // Get the Gadget app URL for the widget script
    const rawGadgetAppUrl = process.env.GADGET_APP_URL || process.env.GADGET_PUBLIC_APP_URL || "https://your-app.gadget.app";

    // Ensure gadgetAppUrl is a valid string to prevent "Cannot read properties of undefined" error
    if (!rawGadgetAppUrl || typeof rawGadgetAppUrl !== 'string') {
      logger.error("Gadget app URL is not properly configured");
      return reply.code(500).send({
        success: false,
        error: "Gadget app URL is not properly configured"
      });
    }

    // Normalize URL to avoid double slashes
    const gadgetAppUrl = rawGadgetAppUrl.replace(/\/+$/, "");
    // Add version parameter for cache busting - increment this when widget is updated
    const widgetVersion = "1.0.57";
    const scriptSrc = `${gadgetAppUrl}/widget-loader.js?v=${widgetVersion}`;

    // Try to get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;

    // If no current connection, try to get the first store and create a connection
    if (!bigcommerceConnection) {
      logger.info("No current connection, attempting to get store from database");
      try {
        const store = await api.internal.bigcommerce.store.findFirst();
        if (store) {
          logger.info(`Found store in database: ${store.storeHash || store.id}`);

          // For Gadget's single-click connection, create a connection for the found store
          // Using forStore ensures we use the store's credentials instead of relying on current
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
          logger.warn("No store found in database");
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
        scriptSrc,
        message: "Please add the widget script manually using one of the methods below.",
        instructions: [
          "Option 1: Use Script Manager (Recommended)",
          "1. Go to Storefront → Script Manager",
          "2. Click 'Create a Script'",
          "3. Fill in the following:",
          "   - Name: Product Table Widget Loader",
          "   - Description: Loads product table widgets",
          `   - Script URL: ${scriptSrc}`,
          "   - Location: Footer",
          "   - Load method: Defer",
          "   - Pages: All pages",
          "4. Click 'Save'",
          "",
          "Option 2: Edit Theme Files",
          "1. Go to Storefront → Themes → [Active Theme] → Advanced → Edit Theme Files",
          "2. Open templates/layout/base.html",
          `3. Add this line before </body>:`,
          `   <script src="${scriptSrc}" defer></script>`,
          "4. Click 'Save & Apply'"
        ]
      });
    }

    logger.info(`Attempting to inject script: ${scriptSrc}`);

    // Check if script already exists
    let existingScripts: any;
    try {
      existingScripts = await bigcommerceConnection.v3.get('/content/scripts') as any;
    } catch (getError) {
      const errorMessage = (getError as Error).message;
      logger.warn(`Could not fetch existing scripts: ${errorMessage}`);

      // Check if this is an access token problem
      if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
        logger.error("Access token is required - authentication has failed");
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
            "If you continue to have issues, you can add the widget script manually:",
            "Option 1: Use Script Manager (Recommended)",
            "1. Go to Storefront → Script Manager",
            "2. Click 'Create a Script",
            `3. Script URL: ${scriptSrc}`,
            "4. Location: Footer, Load method: Defer, Pages: All pages"
          ]
        });
      }

      existingScripts = { data: [] };
    }

    const scriptExists = existingScripts?.data?.some((script: any) =>
      script.name === "Product Table Widget Loader"
    );

    if (scriptExists) {
      logger.info("Widget script already installed");
      return reply.code(200).send({
        success: true,
        message: "Widget script is already installed",
        alreadyInstalled: true
      });
    }

    // Script configuration
    const scriptConfig: any = {
      name: "Product Table Widget Loader",
      description: "Loads and initializes Product Table Widgets on the storefront",
      src: scriptSrc,
      auto_uninstall: true,
      load_method: "defer" as const,
      location: "footer" as const,
      visibility: "all_pages" as const,
      kind: "src" as const,
      consent_category: "essential" as const
    };

    // Try to inject the script
    try {
      const response = await bigcommerceConnection.v3.post('/content/scripts' as any, {
        body: scriptConfig
      }) as any;

      if (response?.uuid) {
        logger.info(`Widget script injected successfully: uuid=${response.uuid}`);
        return reply.code(200).send({
          success: true,
          scriptUuid: response.uuid,
          scriptSrc,
          message: "Widget script installed successfully. Widgets will now work on your storefront."
        });
      }
    } catch (apiError: unknown) {
      const apiErr = apiError as any;
      const errorMessage = apiErr?.message || JSON.stringify(apiErr);
      logger.warn(`Script injection API error: ${errorMessage}`);

      // Check if this is an authentication error
      if (errorMessage.includes('access token is required') || errorMessage.includes('Invalid credentials')) {
        logger.error("Access token is required during script injection - authentication has failed");
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
            "If you continue to have issues, you can add the widget script manually:",
            "Option 1: Use Script Manager (Recommended)",
            "1. Go to Storefront → Script Manager",
            "2. Click 'Create a Script",
            `3. Script URL: ${scriptSrc}`,
            "4. Location: Footer, Load method: Defer, Pages: All pages"
          ]
        });
      }

      // Scripts API might not be available or might fail for other reasons
      // Return success with manual instructions
      return reply.code(200).send({
        success: true,
        manualSetup: true,
        scriptSrc,
        message: "Automatic script injection is not available. Please add the script manually.",
        instructions: [
          "Option 1: Use Script Manager (Recommended)",
          "1. Go to Storefront → Script Manager",
          "2. Click 'Create a Script'",
          `3. Script URL: ${scriptSrc}`,
          "4. Location: Footer, Load method: Defer, Pages: All pages",
          "",
          "Option 2: Edit Theme Files",
          "1. Go to Storefront → Themes → [Active Theme] → Advanced → Edit Theme Files",
          "2. Open templates/layout/base.html",
          `3. Add before </body>: <script src="${scriptSrc}" defer></script>`
        ]
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error injecting widget script: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unknown error occurred"
    });
  }
}
