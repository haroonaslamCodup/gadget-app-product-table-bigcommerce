import { useState } from "styled-components";
import styled from "styled-components";
import { ProductTableRow } from "./ProductTableRow";

interface GroupedViewProps {
  products: any[];
  displayFormat: "folded" | "grouped-variants" | "grouped-category" | "grouped-collection";
  columns: string[];
  isLoading?: boolean;
}

export const GroupedView = ({
  products,
  displayFormat,
  columns,
  isLoading,
}: GroupedViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  };

  const groupProducts = () => {
    const groups: Record<string, any[]> = {};

    if (displayFormat === "folded") {
      // Group by base product (parent product)
      products.forEach((product) => {
        const baseId = product.base_variant_id || product.id;
        if (!groups[baseId]) {
          groups[baseId] = [];
        }
        groups[baseId].push(product);
      });
    } else if (displayFormat === "grouped-variants") {
      // Group variants by product
      products.forEach((product) => {
        const productId = product.product_id || product.id;
        if (!groups[productId]) {
          groups[productId] = [];
        }
        groups[productId].push(product);
      });
    } else if (displayFormat === "grouped-category") {
      // Group by category
      products.forEach((product) => {
        const category = product.categories?.[0]?.name || "Uncategorized";
        if (!groups[category]) {
          groups[category] = [];
        }
        groups[category].push(product);
      });
    } else if (displayFormat === "grouped-collection") {
      // Group by collection
      products.forEach((product) => {
        const collection = product.collections?.[0]?.name || "Uncategorized";
        if (!groups[collection]) {
          groups[collection] = [];
        }
        groups[collection].push(product);
      });
    }

    return groups;
  };

  const groups = groupProducts();

  if (isLoading) {
    return (
      <LoadingContainer>
        <LoadingText>Loading products...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <GroupedContainer>
      {Object.entries(groups).map(([groupKey, groupProducts]) => {
        const isExpanded = expandedGroups.has(groupKey);
        const mainProduct = groupProducts[0];
        const variantCount = groupProducts.length;

        return (
          <GroupCard key={groupKey}>
            <GroupHeader onClick={() => toggleGroup(groupKey)}>
              <GroupTitle>
                {displayFormat === "grouped-category" || displayFormat === "grouped-collection"
                  ? groupKey
                  : mainProduct.name}
              </GroupTitle>
              <GroupMeta>
                {variantCount > 1 && <VariantCount>{variantCount} variants</VariantCount>}
                <ExpandIcon $expanded={isExpanded}>{isExpanded ? "−" : "+"}</ExpandIcon>
              </GroupMeta>
            </GroupHeader>

            {isExpanded ? (
              <GroupContent>
                <Table>
                  <tbody>
                    {groupProducts.map((product: any) => (
                      <ProductTableRow
                        key={product.id}
                        product={product}
                        columns={columns}
                      />
                    ))}
                  </tbody>
                </Table>
              </GroupContent>
            ) : (
              <CollapsedPreview>
                <ProductTableRow
                  key={mainProduct.id}
                  product={mainProduct}
                  columns={columns}
                />
              </CollapsedPreview>
            )}
          </GroupCard>
        );
      })}
    </GroupedContainer>
  );
};

const GroupedContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GroupCard = styled.div`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  overflow: hidden;
`;

const GroupHeader = styled.div`
  padding: 1rem 1.5rem;
  background: #f5f5f5;
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: #ebebeb;
  }
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
`;

const GroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const VariantCount = styled.span`
  font-size: 0.875rem;
  color: #666;
  padding: 0.25rem 0.75rem;
  background: white;
  border-radius: 4px;
`;

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  font-size: 1.5rem;
  font-weight: 300;
  color: #666;
  line-height: 1;
  transition: transform 0.2s;
  transform: ${(props) => (props.$expanded ? "rotate(0deg)" : "rotate(0deg)")};
`;

const GroupContent = styled.div`
  padding: 0;
`;

const CollapsedPreview = styled.div`
  padding: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;

  tr {
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }
  }

  td {
    padding: 1rem;
  }
`;

const LoadingContainer = styled.div`
  padding: 4rem 2rem;
  text-align: center;
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1rem;
`;
