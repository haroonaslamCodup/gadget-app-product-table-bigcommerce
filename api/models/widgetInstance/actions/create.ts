import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger }) => {
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
  logger.info(`Creating new widget instance: ${record.widgetId}`);

  // Save the record
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger }) => {
  logger.info(`Widget instance created successfully: ${record.widgetId}`);
};

export const options: ActionOptions = {
  actionType: "create",
};
