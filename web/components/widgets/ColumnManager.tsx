import { Box, Checkbox, Text, Flex } from "@bigcommerce/big-design";
import { useCallback, useState } from "react";
import styled from "styled-components";

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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleToggleColumn = useCallback((columnId: string, checked: boolean) => {
    if (checked) {
      const newColumns = [...columns, columnId];
      const newOrder = [...columnsOrder, columnId];
      onChange(newColumns, newOrder);
    } else {
      const newColumns = columns.filter((c) => c !== columnId);
      const newOrder = columnsOrder.filter((c) => c !== columnId);
      onChange(newColumns, newOrder);
    }
  }, [columns, columnsOrder, onChange]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", "");
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newOrder = [...columnsOrder];
    const [removed] = newOrder.splice(draggedIndex, 1);
    newOrder.splice(dropIndex, 0, removed);

    onChange(columns, newOrder);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const enabledItems = columnsOrder
    .map((id) => AVAILABLE_COLUMNS.find((c) => c.id === id))
    .filter((col): col is typeof AVAILABLE_COLUMNS[0] => col !== undefined);

  return (
    <Box>
      {/* Section 1: Enable/Disable Columns */}
      <Text bold marginBottom="small">
        Select Columns to Display
      </Text>
      <Box
        border="box"
        borderRadius="normal"
        padding="medium"
        backgroundColor="secondary10"
        marginBottom="large"
      >
        <Flex flexDirection="row" flexWrap="wrap" flexGap="medium">
          {AVAILABLE_COLUMNS.map((column) => (
            <Box key={column.id} style={{ minWidth: "200px" }}>
              <Checkbox
                checked={columns.includes(column.id)}
                onChange={(e) => handleToggleColumn(column.id, e.target.checked)}
                label={column.label}
              />
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Section 2: Reorder Enabled Columns via HTML5 Drag & Drop */}
      {enabledItems.length > 0 ? (
        <Box>
          <Text bold marginBottom="small">
            Column Display Order
          </Text>
          <Text color="secondary60" marginBottom="small">
            Drag rows to reorder how columns appear in your table.
          </Text>
          <DragTable>
            <thead>
              <tr>
                <DragTableHeader style={{ width: "80px" }}>Order</DragTableHeader>
                <DragTableHeader>Column Name</DragTableHeader>
                <DragTableHeader>Field ID</DragTableHeader>
              </tr>
            </thead>
            <tbody>
              {enabledItems.map((item, index) => (
                <DragTableRow
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  $isDragging={draggedIndex === index}
                  $isDragOver={dragOverIndex === index && draggedIndex !== index}
                >
                  <DragTableCell>
                    <DragHandle>⋮⋮</DragHandle>
                    <Text bold>#{index + 1}</Text>
                  </DragTableCell>
                  <DragTableCell>
                    <Text bold>{item.label}</Text>
                  </DragTableCell>
                  <DragTableCell>
                    <Text color="secondary60">{item.id}</Text>
                  </DragTableCell>
                </DragTableRow>
              ))}
            </tbody>
          </DragTable>
        </Box>
      ) : (
        <Box
          border="box"
          borderRadius="normal"
          padding="large"
          backgroundColor="secondary10"
          style={{ textAlign: "center" }}
        >
          <Text color="secondary60">
            No columns enabled. Check at least one column above to configure display order.
          </Text>
        </Box>
      )}
    </Box>
  );
};

const DragTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  background: white;
`;

const DragTableHeader = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid #d9d9d9;
  background: #f5f5f5;
  font-weight: 600;
  font-size: 14px;
  color: #313440;
`;

const DragTableRow = styled.tr<{ $isDragging?: boolean; $isDragOver?: boolean }>`
  cursor: move;
  transition: all 0.2s ease;
  background: ${props => props.$isDragging ? "#e6f7ff" : "white"};
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  border-top: ${props => props.$isDragOver ? "2px solid #1890ff" : "none"};

  &:hover {
    background: #fafafa;
  }

  &:not(:last-child) {
    border-bottom: 1px solid #f0f0f0;
  }
`;

const DragTableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: #313440;
`;

const DragHandle = styled.span`
  display: inline-block;
  margin-right: 8px;
  color: #999;
  font-size: 18px;
  vertical-align: middle;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;
