import { applyParams, save, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api }) => {
  // Apply incoming parameters to the record
  applyParams(params, record);

  // Update lastChecked timestamp
  record.lastChecked = new Date();

  // Log widget update
  logger.info("Updating widget instance", {
    widgetId: record.widgetId,
    widgetName: record.widgetName
  });

  // Save the record
  await save(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api }) => {
  logger.info("Widget instance updated successfully", { widgetId: record.widgetId });
};

export const options: ActionOptions = {
  actionType: "update",
};
