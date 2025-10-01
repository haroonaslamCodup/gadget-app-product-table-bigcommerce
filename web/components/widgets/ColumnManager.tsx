import { useState } from "react";
import { Box, Checkbox, Flex, Text } from "@bigcommerce/big-design";

interface ColumnManagerProps {
  columns: string[];
  columnsOrder: string[];
  onChange: (columns: string[], order: string[]) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "image", label: "Product Image" },
  { id: "sku", label: "SKU" },
  { id: "name", label: "Product Name" },
  { id: "price", label: "Price" },
  { id: "stock", label: "Stock Status" },
  { id: "addToCart", label: "Add to Cart" },
];

export const ColumnManager = ({ columns, columnsOrder, onChange }: ColumnManagerProps) => {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  const handleToggleColumn = (columnId: string, checked: boolean) => {
    let newColumns: string[];
    let newOrder: string[];

    if (checked) {
      // Add column
      newColumns = [...columns, columnId];
      newOrder = [...columnsOrder, columnId];
    } else {
      // Remove column
      newColumns = columns.filter((c) => c !== columnId);
      newOrder = columnsOrder.filter((c) => c !== columnId);
    }

    onChange(newColumns, newOrder);
  };

  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedItem(columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();

    if (!draggedItem || draggedItem === targetColumnId) {
      setDraggedItem(null);
      return;
    }

    const newOrder = [...columnsOrder];
    const draggedIndex = newOrder.indexOf(draggedItem);
    const targetIndex = newOrder.indexOf(targetColumnId);

    // Remove dragged item
    newOrder.splice(draggedIndex, 1);
    // Insert at target position
    newOrder.splice(targetIndex, 0, draggedItem);

    onChange(columns, newOrder);
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  return (
    <Box>
      <Text color="secondary60" marginBottom="xSmall">
        Check to enable columns. Drag to reorder.
      </Text>

      <Box
        border="box"
        borderRadius="normal"
        padding="medium"
        backgroundColor="secondary10"
      >
        {AVAILABLE_COLUMNS.map((column) => {
          const isEnabled = columns.includes(column.id);
          const orderIndex = columnsOrder.indexOf(column.id);

          return (
            <Box
              key={column.id}
              draggable={isEnabled}
              onDragStart={(e) => handleDragStart(e, column.id)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
              onDragEnd={handleDragEnd}
              padding="small"
              marginBottom="xSmall"
              backgroundColor={draggedItem === column.id ? "primary10" : "white"}
              border="box"
              borderRadius="normal"
              style={{
                cursor: isEnabled ? "move" : "default",
                transition: "all 0.2s ease",
              }}
            >
              <Flex alignItems="center" justifyContent="space-between">
                <Flex alignItems="center" marginLeft="xSmall" marginRight="xSmall">
                  <Checkbox
                    checked={isEnabled}
                    onChange={(e) => handleToggleColumn(column.id, e.target.checked)}
                    label={column.label}
                  />
                </Flex>

                {isEnabled && (
                  <Flex alignItems="center" marginLeft="xSmall" marginRight="xSmall">
                    <Text color="secondary60">
                      Position: {orderIndex + 1}
                    </Text>
                    <Text color="secondary60">
                      ⋮⋮
                    </Text>
                  </Flex>
                )}
              </Flex>
            </Box>
          );
        })}
      </Box>

      {columns.length > 0 && (
        <Box marginTop="small">
          <Text color="secondary60">
            Column order: {columnsOrder.map((id) => {
              const col = AVAILABLE_COLUMNS.find((c) => c.id === id);
              return col?.label;
            }).join(" → ")}
          </Text>
        </Box>
      )}
    </Box>
  );
};
