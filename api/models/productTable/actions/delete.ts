import { deleteRecord, ActionOptions } from "gadget-server";

export const run: ActionRun = async ({ record, logger }) => {
  // Log widget deletion
  logger.info(`Deleting product table: ${record.productTableId}`);

  // Delete the record
  await deleteRecord(record);
};

export const onSuccess: ActionOnSuccess = async ({ record, logger }) => {
  logger.info(`Widget instance deleted successfully: ${record.productTableId}`);
};

export const options: ActionOptions = {
  actionType: "delete",
};
