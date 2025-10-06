import { useState } from "react";
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
      // Group products (variants already nested within products)
      products.forEach((product) => {
        const productId = product.id;
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
  gap: var(--spacing-md, 1rem);
`;

const GroupCard = styled.div`
  border: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  border-radius: var(--borderRadius-base, 8px);
  background: var(--color-white, var(--container-fill-base, white));
  overflow: hidden;
  box-shadow: var(--elevation-100, 0 2px 4px rgba(0,0,0,0.1));
`;

const GroupHeader = styled.div`
  padding: var(--spacing-md, 1rem) var(--spacing-lg, 1.5rem);
  background: var(--color-greyLightest, var(--table-header-backgroundColor, #f5f5f5));
  border-bottom: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
  transition: background 0.2s;

  &:hover {
    background: var(--color-greyLighter, #ebebeb);
  }
`;

const GroupTitle = styled.h3`
  margin: 0;
  font-size: var(--fontSize-large, 1.125rem);
  font-weight: var(--fontWeight-semiBold, 600);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-textBase, var(--body-font-color, #333));
`;

const GroupMeta = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md, 1rem);
`;

const VariantCount = styled.span`
  font-size: var(--fontSize-small, 0.875rem);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-textSecondary, #666);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.75rem);
  background: var(--color-white, white);
  border-radius: var(--borderRadius-base, 4px);
  border: 1px solid var(--color-greyLight, #e0e0e0);
`;

const ExpandIcon = styled.span<{ $expanded: boolean }>`
  font-size: 1.5rem;
  font-weight: var(--fontWeight-light, 300);
  color: var(--color-textSecondary, #666);
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
    border-bottom: 1px solid var(--color-greyLightest, #f0f0f0);

    &:last-child {
      border-bottom: none;
    }
  }

  td {
    padding: var(--spacing-md, 1rem);
  }
`;

const LoadingContainer = styled.div`
  padding: 4rem 2rem;
  text-align: center;
`;

const LoadingText = styled.p`
  color: var(--color-textSecondary, #666);
  font-size: var(--fontSize-root, 1rem);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
`;
