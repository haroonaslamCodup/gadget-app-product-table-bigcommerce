import { useParams } from "react-router";
import { Box, ProgressCircle, Flex, Text, Panel } from "@bigcommerce/big-design";
import { ProductTableForm } from "../components/widgets/ProductTableForm";
import { useProductTableById } from "../hooks/useProductTables";
import type { WidgetInstance } from "../types";

export const WidgetEditPage = () => {
  const { id } = useParams<{ id: string }>();

  const { data: widget, isLoading, error } = useProductTableById(id);

  if (isLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding="xxxLarge">
        <ProgressCircle />
      </Flex>
    );
  }

  if (error) {
    return (
      <Panel header="Error">
        <Text color="danger">Failed to load widget: {(error as Error).message}</Text>
      </Panel>
    );
  }

  if (!widget) {
    return (
      <Panel header="Not Found">
        <Text>Widget not found</Text>
      </Panel>
    );
  }

  return (
    <Box>
      <ProductTableForm widgetId={id} initialData={widget as WidgetInstance} />
    </Box>
  );
};
