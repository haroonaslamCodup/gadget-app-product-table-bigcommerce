import { deleteRecord, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ record, logger }) => {
  // Log widget deletion
  logger.info(`Deleting widget instance: ${record.widgetId}`);

  // Delete the record
  await deleteRecord(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger }) => {
  logger.info(`Widget instance deleted successfully: ${record.widgetId}`);
};

export const options: ActionOptions = {
  actionType: "delete",
};
