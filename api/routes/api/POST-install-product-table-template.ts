import type { RouteContext } from "gadget-server";
import { readFile } from "fs/promises";
import { join } from "path";

/**
 * POST /api/install-product-table-template
 *
 * Registers the Product Table with BigCommerce Page Builder
 * Called during app installation or manually to refresh product table registration
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
        message: "Use the manual HTML method to add product tables to your pages.",
        instructions: [
          "To add a product table to any page:",
          "1. Go to BigCommerce Admin → Storefront → My Themes",
          "2. Click 'Customize' on your active theme",
          "3. Navigate to the page where you want to add the product table",
          "4. Click 'Add Widget' or drag a widget zone",
          "5. Select 'HTML' widget from the dropdown",
          "6. Paste this code (replace YOUR_PRODUCT_TABLE_ID):",
          "",
          '<div id="product-table-YOUR_PRODUCT_TABLE_ID" class="product-table-widget" data-product-table-widget=\'{"productTableId":"YOUR_PRODUCT_TABLE_ID"}\'><div class="loading">Loading products...</div></div>',
          "",
          "7. Replace YOUR_PRODUCT_TABLE_ID with the actual Product Table ID from the Product Tables page",
          "8. Click 'Save' and 'Publish'"
        ]
      });
    }

    // Load product table configuration from widget-config.json
    let productTableConfig: any;
    try {
      // Try multiple potential paths for the config file
      // The most reliable approach is using __dirname to go up directory structure from this file's location
      const potentialPaths = [
        join(__dirname, "..", "..", "..", "web", "storefront", "widget-config.json"), // From this file: api/routes/api/ -> ../../.. -> root -> web/storefront/
        join(process.cwd(), "web", "storefront", "widget-config.json"),
        join(process.cwd(), "..", "web", "storefront", "widget-config.json"), // If in .gadget subdirectory
        join(process.cwd(), "..", "..", "web", "storefront", "widget-config.json"), // If in deeper subdirectory
        "/opt/render/project/src/web/storefront/widget-config.json", // Render deployment path
        "/app/web/storefront/widget-config.json", // Common deployment path
        join(__dirname, "..", "..", "web", "storefront", "widget-config.json"), // Alternative relative path
      ];
      
      let configContent: string | null = null;
      
      for (const configPath of potentialPaths) {
        try {
          configContent = await readFile(configPath, "utf-8");
          logger.info(`Successfully found widget-config.json at: ${configPath}`);
          break;
        } catch (pathError) {
          logger.debug(`Config path not found: ${configPath}, error: ${(pathError as Error).message}`);
          continue;
        }
      }
      
      if (!configContent) {
        // Last resort: try to determine path based on the project structure dynamically
        try {
          // Try to find the file using a relative path from where this file should be located
          const relativePath = "../../../web/storefront/widget-config.json";
          const resolvedPath = join(__dirname, relativePath);
          configContent = await readFile(resolvedPath, "utf-8");
          logger.info(`Successfully found widget-config.json at: ${resolvedPath} using relative path`);
        } catch (finalError) {
          logger.error(`All attempts to find widget-config.json failed. Last attempt: ../../../web/storefront/widget-config.json, error: ${(finalError as Error).message}`);
          throw new Error("Could not find widget-config.json in any expected location. Make sure the file exists at web/storefront/widget-config.json");
        }
      }
      
      productTableConfig = JSON.parse(configContent);
      logger.info("Successfully loaded widget-config.json");
    } catch (configError) {
      logger.error(`Failed to load widget-config.json: ${(configError as Error).message}`);
      return reply.code(500).send({
        success: false,
        error: `Failed to load product table configuration file: ${(configError as Error).message}`,
        message: "Failed to locate the widget configuration file. Ensure widget-config.json exists in web/storefront/ directory."
      });
    }

    // Map widget-config.json field IDs to BigCommerce template variables
    // BigCommerce uses snake_case in templates, but our config uses camelCase
    const fieldIdMap: Record<string, string> = {
      productTableId: "product_table_id",
      showSearch: "show_search",
      showViewSwitcher: "show_view_switcher",
      customCSS: "custom_css"
    };

    // Transform schema to use BigCommerce-compatible field IDs
    const transformSchema = (schema: any[]): any[] => {
      try {
        return schema.map(tab => ({
          ...tab,
          sections: tab.sections?.map((section: any) => ({
            ...section,
            settings: section.settings?.map((setting: any) => {
              // Create a clean setting object
              const cleanSetting: any = {
                type: setting.type,
                label: setting.label,
              };

              // Only add id if it exists (paragraph type doesn't have id)
              if (setting.id) {
                cleanSetting.id = fieldIdMap[setting.id] || setting.id;
              }

              // Add optional properties if they exist
              if (setting.required !== undefined) cleanSetting.required = setting.required;
              if (setting.default !== undefined) cleanSetting.default = setting.default;
              if (setting.helpText) cleanSetting.helpText = setting.helpText;
              if (setting.content) cleanSetting.content = setting.content; // for paragraph type

              return cleanSetting;
            })
          }))
        }));
      } catch (transformError) {
        logger.error(`Error transforming schema: ${(transformError as Error).message}`);
        throw transformError;
      }
    };

    // Product table template configuration
    const productTableTemplate: any = {
      name: productTableConfig.name,
      description: productTableConfig.description,
      template: `
        <div
          id="product-table-{{product_table_id}}"
          class="product-table-widget"
          data-product-table-widget="{{product_table_id}}"
          data-widget-show-search="{{show_search}}"
          data-widget-show-view-switcher="{{show_view_switcher}}"
        >
          <div class="loading">Loading products...</div>
        </div>
        {{#if custom_css}}
        <style>
          {{custom_css}}
        </style>
        {{/if}}
      `,
      schema: transformSchema(productTableConfig.schema)
    };

    // Validate the product table template before making API call
    if (!productTableTemplate.name || !productTableTemplate.description || !productTableTemplate.template || !productTableTemplate.schema) {
      logger.error("Product table template is missing required fields");
      return reply.code(500).send({
        success: false,
        error: "Product table template configuration is missing required fields",
        productTableConfig: productTableConfig,
        message: "Configuration file is missing required fields (name, description, template, or schema)"
      });
    }

    if (!Array.isArray(productTableTemplate.schema) || productTableTemplate.schema.length === 0) {
      logger.error("Product table template schema is invalid or empty");
      return reply.code(500).send({
        success: false,
        error: "Product table template schema is invalid or empty",
        productTableConfig: productTableConfig,
        message: "Schema configuration is invalid or empty"
      });
    }

    // Try to create product table template via BigCommerce API
    try {
      logger.info(`Attempting to create product table template with name: ${productTableTemplate.name}`);
      logger.info(`Template schema length: ${productTableTemplate.schema?.length}`);
      
      const response = await bigcommerceConnection.v3.post('/content/widget-templates' as any, {
        body: productTableTemplate
      }) as any;

      logger.info(`BigCommerce API response received: ${JSON.stringify(response)}`);

      if (response?.uuid) {
        logger.info(`Product table template created successfully: uuid=${response.uuid}`);
        return reply.code(200).send({
          success: true,
          productTableTemplateUuid: response.uuid,
          message: "Product table template installed successfully. It should now appear in Page Builder."
        });
      } else {
        logger.warn(`BigCommerce API response did not contain UUID: ${JSON.stringify(response)}`);
        return reply.code(500).send({
          success: false,
          error: "BigCommerce API returned unexpected response format",
          response: response,
          message: "Product table template installation failed - response didn't contain expected UUID"
        });
      }
    } catch (apiError: unknown) {
      const apiErr = apiError as any;
      const errorMessage = apiErr?.message || JSON.stringify(apiErr);
      const errorDetails = apiErr?.response ? JSON.stringify(apiErr.response, null, 2) : JSON.stringify(apiError, null, 2);

      logger.error(`Product Table Templates API error: ${errorMessage}`);
      logger.error(`Full error details: ${errorDetails}`);

      // Log the product table template being sent for debugging
      logger.error(`Product table template that failed: ${JSON.stringify(productTableTemplate, null, 2)}`);

      // Check if this is an authentication error
      if (errorMessage.includes('access token is required') || 
          errorMessage.includes('Invalid credentials') || 
          (apiErr?.response?.status === 401)) {
        logger.error("Access token is required during product table template installation - authentication has failed");
        return reply.code(200).send({
          success: false,
          error: "AUTHENTICATION_REQUIRED",
          message: "The app needs to be reinstalled to refresh authentication credentials.",
          instructions: [
            "The BigCommerce connection has expired or is invalid.",
            "To fix this issue:",
            "",
            "1. Go to BigCommerce Admin → Apps & Customizations → My Apps",
            "2. Find 'Product Table' app",
            "3. Click 'Uninstall' to remove the app completely",
            "4. Reinstall the app from the BigCommerce marketplace",
            "5. Make sure to approve all permission requests during installation",
            "",
            "This will refresh the authentication and restore full functionality.",
            "",
            "If you continue to have issues, you can add product tables manually:",
            "1. Go to BigCommerce Page Builder",
            "2. Add an 'HTML' widget to your page",
            "3. Paste this code:",
            `<div id="product-table-{PRODUCT_TABLE_ID}" class="product-table-widget" data-product-table-widget='{"productTableId":"{PRODUCT_TABLE_ID}"}'><div class="loading">Loading...</div></div>`,
            "4. Replace {PRODUCT_TABLE_ID} with your actual product table ID"
          ]
        });
      }

      // Handle specific API errors
      if (apiErr?.response?.status === 403) {
        logger.error("Permission denied error when creating widget template");
        return reply.code(500).send({
          success: false,
          error: "PERMISSION_DENIED",
          message: "The app doesn't have sufficient permissions to create widget templates. Please reinstall the app with all required permissions.",
          instructions: [
            "The app needs additional permissions to create widget templates.",
            "Please reinstall the app from the BigCommerce marketplace,",
            "ensuring all permission requests are approved during installation."
          ]
        });
      }

      // Return the actual error instead of a generic message
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        errorDetails: errorDetails,
        responseStatus: apiErr?.response?.status,
        message: `Failed to install product table template: ${errorMessage}`,
        productTableTemplate: productTableTemplate,
        instructions: [
          "Check the error details above to see what went wrong.",
          "Common issues:",
          "- Invalid schema format",
          "- Unsupported field types or properties",
          "- Missing required fields",
          "- Insufficient app permissions",
          "",
          "As a workaround, you can add product tables manually:",
          "1. Go to BigCommerce Page Builder",
          "2. Add an 'HTML' widget to your page",
          "3. Paste this code:",
          `<div id="product-table-{PRODUCT_TABLE_ID}" class="product-table-widget" data-product-table-widget='{"productTableId":"{PRODUCT_TABLE_ID}"}'><div class="loading">Loading...</div></div>`,
          "4. Replace {PRODUCT_TABLE_ID} with your actual product table ID"
        ]
      });
    }

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error installing product table template: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({
      success: false,
      error: err.message || "Unknown error occurred"
    });
  }
}
