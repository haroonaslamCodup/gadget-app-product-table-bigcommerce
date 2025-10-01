import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Flex,
  H1,
  Panel,
  ProgressCircle,
  Text,
  Link,
  Badge,
} from "@bigcommerce/big-design";
import { AddIcon, EditIcon, DeleteIcon, FileCopyIcon } from "@bigcommerce/big-design-icons";
import { api } from "../api";
import { useWidgets, useDeleteWidget, useDuplicateWidget } from "../hooks/useWidgets";
import type { WidgetInstance } from "../types";

export const WidgetsPage = () => {
  const navigate = useNavigate();

  // Fetch current store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  // Fetch widgets for this store
  const { data: widgets, isLoading: widgetsLoading, error } = useWidgets(store?.id);

  // Mutations
  const deleteWidget = useDeleteWidget();
  const duplicateWidget = useDuplicateWidget(store?.id);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteWidget.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete widget:", error);
        alert("Failed to delete widget");
      }
    }
  };

  const handleDuplicate = async (widget: WidgetInstance) => {
    try {
      const newWidget = await duplicateWidget.mutateAsync(widget);
      if (newWidget) {
        navigate(`/widgets/${newWidget.id}/edit`);
      }
    } catch (error) {
      console.error("Failed to duplicate widget:", error);
      alert("Failed to duplicate widget");
    }
  };

  if (storeLoading || widgetsLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding="xxxLarge">
        <ProgressCircle />
      </Flex>
    );
  }

  if (error) {
    return (
      <Panel header="Error">
        <Text color="danger">Failed to load widgets: {(error as Error).message}</Text>
      </Panel>
    );
  }

  // Ensure widgets is always an array
  const widgetData: WidgetInstance[] = Array.isArray(widgets) ? widgets : [];

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="medium">
        <H1>Product Table Widgets</H1>
        <Button
          iconLeft={<AddIcon />}
          onClick={() => navigate("/widgets/new")}
        >
          Create New Widget
        </Button>
      </Flex>

      {widgetData.length === 0 ? (
        <Panel>
          <Flex flexDirection="column" alignItems="center" padding="xxxLarge">
            <Text marginBottom="medium">No widgets created yet</Text>
            <Text color="secondary60" marginBottom="large">
              Create your first product table widget to get started
            </Text>
            <Button
              iconLeft={<AddIcon />}
              onClick={() => navigate("/widgets/new")}
            >
              Create Widget
            </Button>
          </Flex>
        </Panel>
      ) : (
        <Panel>
          <Box padding="medium">
            {widgetData.map((widget: WidgetInstance) => (
              <Flex
                key={widget.id}
                justifyContent="space-between"
                alignItems="center"
                padding="medium"
                borderBottom="box"
              >
                <Box>
                  <Link onClick={() => navigate(`/widgets/${widget.id}/edit`)}>
                    <Text bold>{widget.widgetName || "Unnamed Widget"}</Text>
                  </Link>
                  <Text color="secondary60">
                    {widget.widgetId}
                  </Text>
                </Box>
                <Flex alignItems="center">
                  <Badge
                    label={widget.placementLocation || "Not Set"}
                    variant={widget.placementLocation ? "secondary" : "warning"}
                    marginRight="small"
                  />
                  <Badge
                    label={widget.isActive ? "Active" : "Inactive"}
                    variant={widget.isActive ? "success" : "secondary"}
                    marginRight="small"
                  />
                  <Button
                    variant="subtle"
                    iconOnly={<EditIcon />}
                    onClick={() => navigate(`/widgets/${widget.id}/edit`)}
                    aria-label="Edit"
                    marginRight="xSmall"
                  />
                  <Button
                    variant="subtle"
                    iconOnly={<FileCopyIcon />}
                    onClick={() => handleDuplicate(widget)}
                    isLoading={duplicateWidget.isPending}
                    aria-label="Duplicate"
                    marginRight="xSmall"
                  />
                  <Button
                    variant="subtle"
                    iconOnly={<DeleteIcon />}
                    onClick={() => handleDelete(widget.id, widget.widgetName || "Unnamed Widget")}
                    isLoading={deleteWidget.isPending}
                    aria-label="Delete"
                  />
                </Flex>
              </Flex>
            ))}
          </Box>
        </Panel>
      )}

      <Box marginTop="medium">
        <Text color="secondary60">
          Total widgets: {widgetData.length}
        </Text>
      </Box>
    </Box>
  );
};
