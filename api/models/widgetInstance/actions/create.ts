import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api }) => {
  // Apply incoming parameters to the record
  applyParams(params, record);

  // Generate a unique widget ID if not provided
  if (!record.widgetId) {
    record.widgetId = `widget-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Set default version if not provided
  if (!record.version) {
    record.version = "1.0.0";
  }

  // Set default columns if not provided
  if (!record.columns) {
    record.columns = ["image", "sku", "name", "price", "stock", "addToCart"];
  }

  // Set default columns order if not provided
  if (!record.columnsOrder) {
    record.columnsOrder = ["image", "sku", "name", "price", "stock", "addToCart"];
  }

  // Log widget creation
  logger.info("Creating new widget instance", {
    widgetId: record.widgetId,
    widgetName: record.widgetName,
    storeId: record.storeId
  });

  // Save the record
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api }) => {
  logger.info("Widget instance created successfully", { widgetId: record.widgetId });
};

export const options: ActionOptions = {
  actionType: "create",
};
