import { ActionOptions, applyParams, save } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger }) => {
  // Apply incoming parameters to the record
  applyParams(params, record);

  // Generate a unique product table ID if not provided
  if (!record.productTableId) {
    record.productTableId = `product-table-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  // Set default version if not provided
  if (!record.version) {
    record.version = "1.0.30";
  }

  // Set default columns if not provided
  if (!record.columns) {
    record.columns = ["image", "sku", "name", "price", "stock", "addToCart"];
  }

  // Set default columns order if not provided
  if (!record.columnsOrder) {
    record.columnsOrder = ["image", "sku", "name", "price", "stock", "addToCart"];
  }

  // Log product table creation
  logger.info(`Creating new product table: ${record.productTableId}`);

  // Save the record
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger }) => {
  logger.info(`Product table created successfully: ${record.productTableId}`);
};

export const options: ActionOptions = {
  actionType: "create",
};
