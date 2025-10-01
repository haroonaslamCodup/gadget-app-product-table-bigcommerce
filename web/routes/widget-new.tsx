import { Box, H1 } from "@bigcommerce/big-design";
import { WidgetForm } from "../components/widgets/WidgetForm";

export const WidgetNewPage = () => {
  return (
    <Box>
      <H1>Create New Widget</H1>
      <WidgetForm />
    </Box>
  );
};
