import { deleteRecord, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ params, record, logger, api }) => {
  // Log widget deletion
  logger.info("Deleting widget instance", {
    widgetId: record.widgetId,
    widgetName: record.widgetName
  });

  // Delete the record
  await deleteRecord(record);
};

export const onSuccess: ActionOnSuccess = async ({ params, record, logger, api }) => {
  logger.info("Widget instance deleted successfully", { widgetId: record.widgetId });
};

export const options: ActionOptions = {
  actionType: "delete",
};
