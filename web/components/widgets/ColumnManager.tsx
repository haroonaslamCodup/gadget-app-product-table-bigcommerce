import { Box, Button, Checkbox, Flex, Input, Message, Text } from "@bigcommerce/big-design";
import { ArrowDownwardIcon, ArrowUpwardIcon, DeleteIcon } from "@bigcommerce/big-design-icons";
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
  onChange: (columns: string[], order: string[]) => void;
}

const AVAILABLE_COLUMNS = [
  { id: "image", label: "Product Image", icon: "🖼️" },
  { id: "sku", label: "SKU", icon: "🏷️" },
  { id: "name", label: "Product Name", icon: "📦" },
  { id: "price", label: "Price", icon: "💰" },
  { id: "stock", label: "Stock Status", icon: "📊" },
  { id: "addToCart", label: "Add to Cart", icon: "🛒" },
];

interface SortableItemProps {
  id: string;
  label: string;
  icon: string;
  index: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function SortableItem({ id, label, icon, index, onRemove, onMoveUp, onMoveDown, isFirst, isLast }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <DraggableCard
      ref={setNodeRef}
      style={style}
      $isDragging={isDragging}
    >
      <DragHandle
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${label}`}
        title="Drag to reorder"
      >
        <DragIcon>⠿</DragIcon>
      </DragHandle>

      <CardContent>
        <ColumnInfo>
          <OrderBadge>#{index + 1}</OrderBadge>
          <ColumnLabel>
            <span style={{ marginRight: "8px" }}>{icon}</span>
            <Text bold>{label}</Text>
          </ColumnLabel>
        </ColumnInfo>

        <ActionButtons>
          <QuickActionButton
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label={`Move ${label} up`}
            title="Move up"
          >
            <ArrowUpwardIcon />
          </QuickActionButton>
          <QuickActionButton
            onClick={onMoveDown}
            disabled={isLast}
            aria-label={`Move ${label} down`}
            title="Move down"
          >
            <ArrowDownwardIcon />
          </QuickActionButton>
          <RemoveButton
            onClick={onRemove}
            aria-label={`Remove ${label} column`}
            title="Remove column"
          >
            <DeleteIcon />
          </RemoveButton>
        </ActionButtons>
      </CardContent>
    </DraggableCard>
  );
}

export const ColumnManager = ({ columns, columnsOrder, onChange }: ColumnManagerProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = columnsOrder.indexOf(active.id as string);
      const newIndex = columnsOrder.indexOf(over.id as string);
      const newOrder = arrayMove(columnsOrder, oldIndex, newIndex);
      onChange(columns, newOrder);
    }

    setActiveId(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...columnsOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    onChange(columns, newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === columnsOrder.length - 1) return;
    const newOrder = [...columnsOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    onChange(columns, newOrder);
  };

  const handleResetOrder = () => {
    const confirmed = window.confirm(
      "Are you sure you want to reset the column order to default? This will rearrange your columns."
    );

    if (!confirmed) return;

    // Reset to default order based on AVAILABLE_COLUMNS
    const defaultOrder = AVAILABLE_COLUMNS
      .filter(col => columns.includes(col.id))
      .map(col => col.id);
    onChange(columns, defaultOrder);
  };

  const enabledItems = columnsOrder
    .map((id) => AVAILABLE_COLUMNS.find((c) => c.id === id))
    .filter((col): col is typeof AVAILABLE_COLUMNS[0] => col !== undefined);

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
            <ColumnCount>{columns.length} / {AVAILABLE_COLUMNS.length} selected</ColumnCount>
          </SectionHeader>

          <SearchBox marginBottom="medium">
            <Input
              placeholder="Search columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBox>

          <ColumnList>
            {filteredAvailableColumns.map((column) => (
              <ColumnCheckboxCard
                key={column.id}
                $isChecked={columns.includes(column.id)}
              >
                <Checkbox
                  checked={columns.includes(column.id)}
                  onChange={(e) => handleToggleColumn(column.id, e.target.checked)}
                  label={`${column.icon} ${column.label}`}
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
            {columnsOrder.length > 1 && (
              <Button variant="subtle" onClick={handleResetOrder}>
                Reset to Default
              </Button>
            )}
          </SectionHeader>

          <Text color="secondary60" marginBottom="medium">
            Drag cards to reorder, or use the arrow buttons. This determines the column order in your product table.
          </Text>

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
                items={columnsOrder}
                strategy={verticalListSortingStrategy}
              >
                <DragList>
                  {enabledItems.map((item, index) => (
                    <SortableItem
                      key={item.id}
                      id={item.id}
                      label={item.label}
                      icon={item.icon}
                      index={index}
                      onRemove={() => handleToggleColumn(item.id, false)}
                      onMoveUp={() => handleMoveUp(index)}
                      onMoveDown={() => handleMoveDown(index)}
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
                          #{columnsOrder.indexOf(activeId) + 1}
                        </OrderBadge>
                        <ColumnLabel>
                          <span style={{ marginRight: "8px" }}>{activeItem.icon}</span>
                          <Text bold>{activeItem.label}</Text>
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

const ColumnCheckboxCard = styled.div<{ $isChecked?: boolean }>`
  width: 100%;
  box-sizing: border-box;
  padding: 12px 16px;
  border: 2px solid ${props =>
    props.$isChecked
      ? "var(--bc-color-primary, #1890ff)"
      : "var(--bc-color-grey20, #f0f0f0)"
  };
  border-radius: 8px;
  background: ${props =>
    props.$isChecked
      ? "var(--bc-color-primary05, #f0f8ff)"
      : "var(--bc-color-white, white)"
  };
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    border-color: ${props =>
    props.$isChecked
      ? "var(--bc-color-primary-dark, #1070d0)"
      : "var(--bc-color-grey40, #bfbfbf)"
  };
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }
`;

const DragList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const DraggableCard = styled.div<{ $isDragging?: boolean; $isOverlay?: boolean }>`
  display: flex;
  align-items: center;
  background: var(--bc-color-white, white);
  border: 2px solid var(--bc-color-grey20, #f0f0f0);
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
    border-color: var(--bc-color-grey30, #d9d9d9);
    transform: ${props => props.$isOverlay ? "none" : "translateY(-2px)"};
  }
`;

const DragHandle = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bc-color-grey10, #f5f5f5);
  cursor: grab;
  transition: all 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: var(--bc-color-grey20, #f0f0f0);
    transform: scale(1.1);
  }

  &:active {
    cursor: grabbing;
    background: var(--bc-color-grey30, #d9d9d9);
    transform: scale(0.95);
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

const OrderBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bc-color-primary, #1890ff);
  color: white;
  border-radius: 6px;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
`;

const ColumnLabel = styled.div`
  display: flex;
  align-items: center;
  font-size: 15px;
  color: var(--bc-color-text-primary, #313440);
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

  &:hover {
    background: var(--bc-color-error-lighter, #fff1f0);
    border-color: var(--bc-color-error, #ff4d4f);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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
