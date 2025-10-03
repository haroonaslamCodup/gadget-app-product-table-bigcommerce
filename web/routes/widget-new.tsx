import { Box, H1 } from "@bigcommerce/big-design";
import { ProductTableForm } from "../components/widgets/ProductTableForm";

export const WidgetNewPage = () => {
  return (
    <Box>
      <H1>Create New Widget</H1>
      <ProductTableForm />
    </Box>
  );
};
