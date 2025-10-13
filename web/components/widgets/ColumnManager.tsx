import { Box, Button, Checkbox, Flex, Input, Message, Small, Text } from "@bigcommerce/big-design";
import { ArrowDownwardIcon, ArrowUpwardIcon, DeleteIcon, EditIcon } from "@bigcommerce/big-design-icons";
import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useState } from "react";
import styled from "styled-components";

interface ColumnManagerProps {
  columns: string[];
  columnsOrder: string[];
  columnLabels: Record<string, string>;
  onChange: (columns: string[], order: string[], labels: Record<string, string>) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "image", label: "Product Image", icon: "🖼️", required: true },
  { id: "name", label: "Product Name", icon: "📦", required: true },
  { id: "sku", label: "SKU", icon: "🏷️", required: false },
  { id: "price", label: "Price", icon: "💰", required: false },
  { id: "stock", label: "Stock Status", icon: "📊", required: false },
  { id: "addToCart", label: "Add to Cart", icon: "🛒", required: false },
];

// Required columns that cannot be removed and must maintain order
const REQUIRED_COLUMNS = ["image", "name"];

interface SortableItemProps {
  id: string;
  label: string;
  customLabel?: string;
  icon: string;
  index: number;
  isRequired: boolean;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onEditLabel: (newLabel: string) => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({
  id,
  label,
  customLabel,
  icon,
  index,
  isRequired,
  onRemove,
  onMoveUp,
  onMoveDown,
  onEditLabel,
  isFirst,
  isLast
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [tempLabel, setTempLabel] = useState(customLabel || label);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSaveLabel = () => {
    if (tempLabel.trim()) {
      onEditLabel(tempLabel.trim());
    }
    setIsEditingLabel(false);
  };

  const handleCancelEdit = () => {
    setTempLabel(customLabel || label);
    setIsEditingLabel(false);
  };

  const displayLabel = customLabel || label;

  // Disable drag for required columns that must maintain their order
  const canDrag = !isRequired || (index > 1); // Allow dragging if not in first two positions
  const canMoveUp = !isFirst && !(isRequired && index <= 1);
  const canMoveDown = !isLast && !(isRequired && index === 0);

  return (
    <DraggableCard
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
      $isRequired={isRequired}
    >
      <DragHandle
        {...(canDrag ? attributes : {})}
        {...(canDrag ? listeners : {})}
        aria-label={canDrag ? `Drag to reorder ${displayLabel}` : `${displayLabel} position is fixed`}
        title={canDrag ? "Drag to reorder" : "Position fixed"}
        $disabled={!canDrag}
      >
        <DragIcon>{canDrag ? "⠿" : "🔒"}</DragIcon>
      </DragHandle>

      <CardContent>
        <ColumnInfo>
          <OrderBadge $isRequired={isRequired}>#{index + 1}</OrderBadge>
          <ColumnLabelWrapper>
            {isEditingLabel ? (
              <LabelEditContainer>
                <Input
                  value={tempLabel}
                  onChange={(e) => setTempLabel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveLabel();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                  placeholder={label}
                />
                <Flex marginTop="xSmall">
                  <Button onClick={handleSaveLabel} marginRight="xSmall">Save</Button>
                  <Button variant="subtle" onClick={handleCancelEdit}>Cancel</Button>
                </Flex>
              </LabelEditContainer>
            ) : (
              <ColumnLabel>
                <span style={{ marginRight: "8px" }}>{icon}</span>
                <div>
                  <Text margin="none" >{displayLabel}
                    {customLabel && (
                      <Small style={{ display: "inline-block" }} color="secondary60" bold> (Custom)</Small>
                    )}
                  </Text>

                  {isRequired && (
                    <RequiredBadge>Required</RequiredBadge>
                  )}
                </div>
              </ColumnLabel>
            )}
          </ColumnLabelWrapper>
        </ColumnInfo>

        <ActionButtons>
          {!isEditingLabel && (
            <>
              <QuickActionButton
                type="button"
                onClick={() => setIsEditingLabel(true)}
                aria-label={`Edit label for ${displayLabel}`}
                title="Edit label"
              >
                <EditIcon />
              </QuickActionButton>
              <QuickActionButton
                type="button"
                onClick={onMoveUp}
                disabled={!canMoveUp}
                aria-label={`Move ${displayLabel} up`}
                title={canMoveUp ? "Move up" : "Cannot move up"}
              >
                <ArrowUpwardIcon />
              </QuickActionButton>
              <QuickActionButton
                type="button"
                onClick={onMoveDown}
                disabled={!canMoveDown}
                aria-label={`Move ${displayLabel} down`}
                title={canMoveDown ? "Move down" : "Cannot move down"}
              >
                <ArrowDownwardIcon />
              </QuickActionButton>
              <RemoveButton
                type="button"
                onClick={onRemove}
                disabled={isRequired}
                aria-label={isRequired ? `${displayLabel} is required and cannot be removed` : `Remove ${displayLabel} column`}
                title={isRequired ? "Required column" : "Remove column"}
              >
                <DeleteIcon />
              </RemoveButton>
            </>
          )}
        </ActionButtons>
      </CardContent>
    </DraggableCard>
  );
}

export const ColumnManager = ({ columns, columnsOrder, columnLabels, onChange }: ColumnManagerProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);

  // Defensive: ensure props are valid arrays
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeColumnsOrder = Array.isArray(columnsOrder) ? columnsOrder : [];
  const safeColumnLabels = columnLabels && typeof columnLabels === 'object' ? columnLabels : {};

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px of movement required before drag starts
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ensure required columns are always included and in correct order
  const ensureRequiredColumns = useCallback((cols: string[], order: string[]): [string[], string[]] => {
    const newCols = new Set(cols);
    const newOrder = [...order];

    // Add required columns if missing
    REQUIRED_COLUMNS.forEach(col => newCols.add(col));

    // Ensure image is first and name is second in the order
    const filteredOrder = newOrder.filter(col => !REQUIRED_COLUMNS.includes(col));
    const finalOrder = ["image", "name", ...filteredOrder].filter(col => newCols.has(col));

    return [Array.from(newCols), finalOrder];
  }, []);

  const handleToggleColumn = useCallback((columnId: string, checked: boolean) => {
    // Prevent unchecking required columns
    if (!checked && REQUIRED_COLUMNS.includes(columnId)) {
      return;
    }

    if (checked) {
      const newColumns = [...safeColumns, columnId];
      const newOrder = [...safeColumnsOrder, columnId];
      const [finalCols, finalOrder] = ensureRequiredColumns(newColumns, newOrder);
      onChange(finalCols, finalOrder, safeColumnLabels);
    } else {
      const newColumns = safeColumns.filter((c) => c !== columnId);
      const newOrder = safeColumnsOrder.filter((c) => c !== columnId);
      const [finalCols, finalOrder] = ensureRequiredColumns(newColumns, newOrder);
      onChange(finalCols, finalOrder, safeColumnLabels);
    }
  }, [safeColumns, safeColumnsOrder, safeColumnLabels, ensureRequiredColumns, onChange]);

  const handleDragStart = (event: DragStartEvent) => {
    const draggedId = event.active.id as string;
    // Prevent dragging required columns to maintain their order
    if (REQUIRED_COLUMNS.includes(draggedId)) {
      const index = safeColumnsOrder.indexOf(draggedId);
      if (index < 2) {
        // Don't allow dragging if in first two positions
        return;
      }
    }
    setActiveId(draggedId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeId = active.id as string;
      const overId = over.id as string;

      // Don't allow moving items into the first two positions (reserved for required columns)
      const overIndex = safeColumnsOrder.indexOf(overId);
      if (overIndex < 2 && !REQUIRED_COLUMNS.includes(activeId)) {
        setActiveId(null);
        return;
      }

      const oldIndex = safeColumnsOrder.indexOf(activeId);
      const newIndex = safeColumnsOrder.indexOf(overId);

      let newOrder = arrayMove(safeColumnsOrder, oldIndex, newIndex);

      // Ensure image and name stay in first two positions
      const [finalCols, finalOrder] = ensureRequiredColumns(safeColumns, newOrder);
      onChange(finalCols, finalOrder, safeColumnLabels);
    }

    setActiveId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const columnId = safeColumnsOrder[index];

    // Prevent moving into required column positions
    if (index === 1 || (index === 2 && REQUIRED_COLUMNS.includes(columnId))) {
      return;
    }

    const newOrder = [...safeColumnsOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];

    const [finalCols, finalOrder] = ensureRequiredColumns(safeColumns, newOrder);
    onChange(finalCols, finalOrder, safeColumnLabels);
  };

  const handleMoveDown = (index: number) => {
    if (index === safeColumnsOrder.length - 1) return;

    const columnId = safeColumnsOrder[index];

    // Prevent moving first required column down
    if (index === 0 && REQUIRED_COLUMNS.includes(columnId)) {
      return;
    }

    const newOrder = [...safeColumnsOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];

    const [finalCols, finalOrder] = ensureRequiredColumns(safeColumns, newOrder);
    onChange(finalCols, finalOrder, safeColumnLabels);
  };

  const handleEditLabel = (columnId: string, newLabel: string) => {
    const newLabels = { ...safeColumnLabels, [columnId]: newLabel };
    onChange(safeColumns, safeColumnsOrder, newLabels);
  };

  const handleResetOrder = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset the column order to default? This will rearrange your columns."
    );

    if (!confirmed) return;

    // Reset to default order based on AVAILABLE_COLUMNS
    const defaultOrder = AVAILABLE_COLUMNS
      .filter(col => safeColumns.includes(col.id))
      .map(col => col.id);

    const [finalCols, finalOrder] = ensureRequiredColumns(safeColumns, defaultOrder);
    onChange(finalCols, finalOrder, safeColumnLabels);
  };

  const enabledItems = safeColumnsOrder
    .map((id) => {
      const found = AVAILABLE_COLUMNS.find((c) => c.id === id);
      if (!found) {
        console.warn(`Column ID "${id}" not found in AVAILABLE_COLUMNS - skipping`);
      }
      return found;
    })
    .filter((col): col is NonNullable<typeof col> => col !== undefined);

  const filteredAvailableColumns = AVAILABLE_COLUMNS.filter(column =>
    column.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    column.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeItem = activeId ? AVAILABLE_COLUMNS.find(col => col.id === activeId) : null;

  return (
    <Container>
      <SectionsWrapper>
        {/* Available columns section with search */}
        <SectionBox>
          <SectionHeader>
            <SectionTitle bold>
              Available Columns
            </SectionTitle>
            <ColumnCount>{safeColumns.length} / {AVAILABLE_COLUMNS.length} selected</ColumnCount>
          </SectionHeader>

          <SearchBox marginBottom="medium">
            <Input
              width="100%"
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>

          <ColumnList>
            {filteredAvailableColumns.map((column) => (
              <ColumnCheckboxCard
                key={column.id}
                $isChecked={safeColumns.includes(column.id)}
                $isRequired={column.required}
              >
                <Checkbox
                  checked={safeColumns.includes(column.id)}
                  onChange={(e) => handleToggleColumn(column.id, e.target.checked)}
                  label={`${column.icon} ${column.label}${column.required ? ' (Required)' : ''}`}
                  disabled={column.required}
                />
              </ColumnCheckboxCard>
            ))}
          </ColumnList>
        </SectionBox>

        {/* Drag and drop reorder section */}
        <SectionBox>
          <SectionHeader>
            <SectionTitle bold>
              Column Display Order
            </SectionTitle>
            {safeColumnsOrder.length > 1 && (
              <Button variant="subtle" onClick={handleResetOrder}>
                Reset to Default
              </Button>
            )}
          </SectionHeader>

          <Text color="secondary60" marginBottom="xSmall">
            Drag cards to reorder, or use the arrow buttons. Click the edit icon to customize column labels.
          </Text>
          <Small color="secondary60" marginBottom="medium">
            💡 Product Image and Product Name must remain in the first two positions.
          </Small>

          {enabledItems.length === 0 ? (
            <EmptyState>
              <Message
                type="info"
                messages={[
                  { text: "No columns selected. Check at least one column above to get started." }
                ]}
              />
            </EmptyState>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={safeColumnsOrder}
                strategy={verticalListSortingStrategy}
              >
                <DragList>
                  {enabledItems.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      customLabel={safeColumnLabels[item.id]}
                      icon={item.icon}
                      index={index}
                      isRequired={item.required || false}
                      onRemove={() => handleToggleColumn(item.id, false)}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
                      onEditLabel={(newLabel) => handleEditLabel(item.id, newLabel)}
                      isFirst={index === 0}
                      isLast={index === enabledItems.length - 1}
                    />
                  ))}
                </DragList>
              </SortableContext>
              <DragOverlay>
                {activeId && activeItem ? (
                  <DraggableCard $isDragging $isOverlay>
                    <DragHandle>
                      <DragIcon>⠿</DragIcon>
                    </DragHandle>
                    <CardContent>
                      <ColumnInfo>
                        <OrderBadge>
                          #{safeColumnsOrder.indexOf(activeId) + 1}
                        </OrderBadge>
                        <ColumnLabel>
                          <span style={{ marginRight: "8px" }}>{activeItem.icon}</span>
                          <Text bold>{safeColumnLabels[activeId] || activeItem.label}</Text>
                        </ColumnLabel>
                      </ColumnInfo>
                    </CardContent>
                  </DraggableCard>
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </SectionBox>
      </SectionsWrapper>
    </Container>
  );
};

// Styled Components

const Container = styled.div`
  width: 100%;
  max-width: 100%;
`;

const SectionsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;

  @media (min-width: 1024px) {
    flex-direction: row;
    align-items: flex-start;

    > * {
      flex: 1;
      min-width: 0;
    }
  }
`;

const SectionBox = styled(Box)`
  width: 100%;
  background: var(--bc-color-white, white);
  border: 1px solid var(--bc-color-grey30, #d9d9d9);
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
`;

const SectionHeader = styled(Flex)`
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const SectionTitle = styled(Text)`
  font-size: 18px;
  font-weight: 600;
`;

const ColumnCount = styled.span`
  font-size: 14px;
  color: var(--bc-color-text-secondary, #666);
  font-weight: 500;
  background: var(--bc-color-grey10, #f5f5f5);
  padding: 4px 12px;
  border-radius: 12px;
`;

const SearchBox = styled(Box)`
  width: 100%;

  input {
    width: 100%;
  }
`;

const ColumnList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
`;

const ColumnCheckboxCard = styled.div<{ $isChecked?: boolean; $isRequired?: boolean }>`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: 2px solid ${props =>
    props.$isRequired
      ? "var(--bc-color-warning-light, #ffe58f)"
      : props.$isChecked
        ? "var(--bc-color-primary, #1890ff)"
        : "var(--bc-color-grey20, #f0f0f0)"
  };
  border-radius: 8px;
  background: ${props =>
    props.$isRequired
      ? "var(--bc-color-warning-lighter, #fffbe6)"
      : props.$isChecked
        ? "var(--bc-color-primary05, #f0f8ff)"
        : "var(--bc-color-white, white)"
  };
  transition: all 0.2s ease;
  cursor: ${props => props.$isRequired ? "not-allowed" : "pointer"};
  opacity: ${props => props.$isRequired ? 0.8 : 1};

  &:hover {
    border-color: ${props =>
    props.$isRequired
      ? "var(--bc-color-warning, #faad14)"
      : props.$isChecked
        ? "var(--bc-color-primary-dark, #1070d0)"
        : "var(--bc-color-grey40, #bfbfbf)"
  };
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    transform: ${props => props.$isRequired ? "none" : "translateY(-1px)"};
  }
`;

const DragList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DraggableCard = styled.div<{ $isDragging?: boolean; $isOverlay?: boolean; $isRequired?: boolean }>`
  display: flex;
  align-items: center;
  background: ${props =>
    props.$isRequired
      ? "var(--bc-color-warning-lighter, #fffbe6)"
      : "var(--bc-color-white, white)"
  };
  border: 2px solid ${props =>
    props.$isRequired
      ? "var(--bc-color-warning-light, #ffe58f)"
      : "var(--bc-color-grey20, #f0f0f0)"
  };
  border-radius: 8px;
  padding: 16px;
  gap: 16px;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: ${props => props.$isDragging && !props.$isOverlay ? 0.4 : 1};
  box-shadow: ${props =>
    props.$isOverlay
      ? "0 8px 24px rgba(0, 0, 0, 0.15)"
      : "0 1px 3px rgba(0, 0, 0, 0.05)"
  };
  cursor: ${props => props.$isOverlay ? "grabbing" : "default"};

  &:hover {
    box-shadow: ${props =>
    props.$isOverlay
      ? "0 8px 24px rgba(0, 0, 0, 0.15)"
      : "0 4px 12px rgba(0, 0, 0, 0.1)"
  };
    border-color: ${props =>
    props.$isRequired
      ? "var(--bc-color-warning, #faad14)"
      : "var(--bc-color-grey30, #d9d9d9)"
  };
    transform: ${props => props.$isOverlay ? "none" : "translateY(-2px)"};
  }
`;

const DragHandle = styled.div<{ $disabled?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: ${props =>
    props.$disabled
      ? "var(--bc-color-grey20, #f0f0f0)"
      : "var(--bc-color-grey10, #f5f5f5)"
  };
  cursor: ${props => props.$disabled ? "not-allowed" : "grab"};
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${props =>
    props.$disabled
      ? "var(--bc-color-grey20, #f0f0f0)"
      : "var(--bc-color-grey20, #f0f0f0)"
  };
    transform: ${props => props.$disabled ? "none" : "scale(1.1)"};
  }

  &:active {
    cursor: ${props => props.$disabled ? "not-allowed" : "grabbing"};
    background: ${props =>
    props.$disabled
      ? "var(--bc-color-grey20, #f0f0f0)"
      : "var(--bc-color-grey30, #d9d9d9)"
  };
    transform: ${props => props.$disabled ? "none" : "scale(0.95)"};
  }
`;

const DragIcon = styled.span`
  font-size: 18px;
  color: var(--bc-color-text-muted, #999);
  font-weight: bold;
  user-select: none;
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: 1;
  gap: 16px;
`;

const ColumnInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
`;

const OrderBadge = styled.div<{ $isRequired?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: ${props =>
    props.$isRequired
      ? "var(--bc-color-warning, #faad14)"
      : "var(--bc-color-primary, #1890ff)"
  };
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
`;

const ColumnLabelWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const ColumnLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 15px;
  color: var(--bc-color-text-primary, #313440);
  gap: 8px;
`;

const RequiredBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: var(--bc-color-warning-light, #ffe58f);
  color: var(--bc-color-warning-dark, #d48806);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
`;

const LabelEditContainer = styled.div`
  width: 100%;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const QuickActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--bc-color-grey30, #d9d9d9);
  background: var(--bc-color-white, white);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--bc-color-text-primary, #313440);

  &:hover:not(:disabled) {
    background: var(--bc-color-grey10, #f5f5f5);
    border-color: var(--bc-color-grey40, #bfbfbf);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const RemoveButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--bc-color-error-light, #ffccc7);
  background: var(--bc-color-white, white);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--bc-color-error, #ff4d4f);

  &:hover:not(:disabled) {
    background: var(--bc-color-error-lighter, #fff1f0);
    border-color: var(--bc-color-error, #ff4d4f);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    background: var(--bc-color-grey10, #f5f5f5);
    border-color: var(--bc-color-grey30, #d9d9d9);
    color: var(--bc-color-grey40, #bfbfbf);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const EmptyState = styled.div`
  padding: 32px;
  text-align: center;
`;
