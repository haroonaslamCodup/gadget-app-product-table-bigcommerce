import { Box, Checkbox, Flex, Text, Input } from "@bigcommerce/big-design";
import { DeleteIcon } from "@bigcommerce/big-design-icons";
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
  const [searchTerm, setSearchTerm] = useState<string>("");

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
  
  // Filter available columns based on search term
  const filteredAvailableColumns = AVAILABLE_COLUMNS.filter(column => 
    column.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
    column.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box>
      {/* Available columns section with search - full width */}
      <Box marginBottom="large">
        <Text bold marginBottom="small">
          Available Columns
        </Text>
        <Box
          border="box"
          borderRadius="normal"
          padding="medium"
          backgroundColor="secondary10"
        >
          <Box marginBottom="medium">
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              width="100%"
            />
          </Box>
          <Text color="secondary60" marginBottom="small">
            {columns.length} of {AVAILABLE_COLUMNS.length} columns selected
          </Text>
          <Flex flexDirection="row" flexWrap="wrap" flexGap="medium">
            {filteredAvailableColumns.map((column) => (
              <Box key={column.id} style={{ minWidth: "240px", flex: "1 1 auto", maxWidth: "300px" }}>
                <Checkbox
                  checked={columns.includes(column.id)}
                  onChange={(e) => handleToggleColumn(column.id, e.target.checked)}
                  label={column.label}
                />
              </Box>
            ))}
          </Flex>
        </Box>
      </Box>
      
      {/* Full-width drag table section */}
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
              <DragTableHeader style={{ width: "80px" }}>Order #</DragTableHeader>
              <DragTableHeader>Column Name</DragTableHeader>
              <DragTableHeader style={{ width: "100px" }}>Actions</DragTableHeader>
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
                  <button 
                    onClick={() => handleToggleColumn(item.id, false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--bc-color-error, #ff4d4f)',
                      cursor: 'pointer',
                      fontSize: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '4px'
                    }}
                    aria-label={`Remove ${item.label} column`}
                  >
                    <DeleteIcon />
                  </button>
                </DragTableCell>
              </DragTableRow>
            ))}
          </tbody>
        </DragTable>
      </Box>
    </Box>
  );
};

const DragTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 1px solid var(--bc-color-grey30, #d9d9d9);
  border-radius: 4px;
  background: var(--bc-color-white, white);
`;

const DragTableHeader = styled.th`
  padding: 12px;
  text-align: left;
  border-bottom: 2px solid var(--bc-color-grey30, #d9d9d9);
  background: var(--bc-color-grey10, #f5f5f5);
  font-weight: 600;
  font-size: 14px;
  color: var(--bc-color-text-primary, #313440);
`;

const DragTableRow = styled.tr<{ $isDragging?: boolean; $isDragOver?: boolean }>`
  cursor: move;
  transition: all 0.2s ease;
  background: ${props => props.$isDragging ? "var(--bc-color-primary10, #e6f7ff)" : "var(--bc-color-white, white)"};
  opacity: ${props => props.$isDragging ? 0.5 : 1};
  border-top: ${props => props.$isDragOver ? "2px solid var(--bc-color-primary, #1890ff)" : "none"};

  &:hover {
    background: var(--bc-color-grey05, #fafafa);
  }

  &:not(:last-child) {
    border-bottom: 1px solid var(--bc-color-grey20, #f0f0f0);
  }
`;

const DragTableCell = styled.td`
  padding: 12px;
  font-size: 14px;
  color: var(--bc-color-text-primary, #313440);
`;

const DragHandle = styled.span`
  display: inline-block;
  margin-right: 8px;
  color: var(--bc-color-text-muted, #999);
  font-size: 18px;
  vertical-align: middle;
  cursor: grab;

  &:active {
    cursor: grabbing;
  }
`;
