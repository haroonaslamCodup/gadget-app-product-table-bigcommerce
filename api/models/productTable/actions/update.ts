import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger }) => {
  // Apply incoming parameters to the record
  applyParams(params, record);

  // Update lastChecked timestamp
  record.lastChecked = new Date();

  // Log widget update
  logger.info(`Updating product table: ${record.productTableId}`);

  // Save the record
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger }) => {
  logger.info(`Widget instance updated successfully: ${record.productTableId}`);
};

export const options: ActionOptions = {
  actionType: "update",
};
