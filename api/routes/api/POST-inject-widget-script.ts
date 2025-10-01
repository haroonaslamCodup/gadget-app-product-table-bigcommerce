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
    const gadgetAppUrl = process.env.GADGET_APP_URL || process.env.GADGET_PUBLIC_APP_URL || "https://your-app.gadget.app";
    const scriptSrc = `${gadgetAppUrl}/widget-loader.js`;

    // Try to get BigCommerce connection
    let bigcommerceConnection = connections.bigcommerce?.current;

    // If no current connection, try to get the first store and create a connection
    if (!bigcommerceConnection) {
      logger.info("No current connection, attempting to get store from database");
      try {
        const store = await api.bigcommerce.store.findFirst();
        if (store) {
          logger.info(`Found store in database: ${store.storeHash}`);
          
          try {
            // Try to create a connection for the store - this will fail if credentials are invalid
            bigcommerceConnection = connections.bigcommerce.forStore(store);
            logger.info(`Created connection for store: ${!!bigcommerceConnection}`);
          } catch (connectionError) {
            logger.warn("Store found in database but unable to create connection - please reinstall the app on your BigCommerce store");
            return reply.code(200).send({
              success: true,
              manualSetup: true,
              scriptSrc,
              message: "Store credentials are missing or invalid. Please reinstall the app on your BigCommerce store.",
              instructions: [
                "1. Go to BigCommerce Admin → Apps & Customizations → My Apps",
                "2. Find your app and reinstall it to establish the connection",
                "3. Once reinstalled, try this setup process again",
                "",
                "Alternatively, add the widget script manually:",
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
      logger.warn(`Could not fetch existing scripts: ${(getError as Error).message}`);
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
      logger.warn(`Script injection API error: ${apiErr?.message || JSON.stringify(apiErr)}`);

      // Scripts API might not be available or might fail
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
