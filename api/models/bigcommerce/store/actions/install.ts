import { ActionOptions, applyParams, save } from "gadget-server";

export const run: ActionRun = async ({ params, record }) => {
  applyParams(params, record);
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger, connections }) => {
  try {
    // Get BigCommerce connection for the installed store
    const bigcommerceConnection = connections.bigcommerce.forStore(record);

    if (!bigcommerceConnection) {
      logger.warn("No BigCommerce connection available during install");
      return;
    }

    // Get the Gadget app URL for the widget script
    const gadgetAppUrl = process.env.GADGET_APP_URL || process.env.GADGET_PUBLIC_APP_URL;

    if (!gadgetAppUrl) {
      logger.error("Gadget app URL is not configured");
      return;
    }

    const widgetVersion = "1.0.58";
    const scriptSrc = `${gadgetAppUrl}/widget-loader.js?v=${widgetVersion}`;

    logger.info(`Injecting widget script: ${scriptSrc}`);

    // Check if script already exists
    let existingScripts: any;
    try {
      existingScripts = await bigcommerceConnection.v3.get('/content/scripts') as any;
    } catch (e) {
      logger.warn(`Could not fetch existing scripts: ${(e as Error).message}`);
      existingScripts = { data: [] };
    }

    const scriptExists = existingScripts?.data?.some((script: any) =>
      script.name === "Product Table Widget Loader"
    );

    if (scriptExists) {
      logger.info("Widget script already installed");
      return;
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

    // Inject the script
    const response = await bigcommerceConnection.v3.post('/content/scripts' as any, {
      body: scriptConfig
    }) as any;

    if (response?.uuid) {
      logger.info(`Widget script injected successfully: uuid=${response.uuid}`);
    } else {
      logger.warn(`Script injection response: ${JSON.stringify(response)}`);
    }
  } catch (error) {
    logger.error(`Error injecting widget script during install: ${(error as Error).message}`);
    // Don't fail the installation if script injection fails
  }
};

export const options: ActionOptions = {
  actionType: "create",
};
