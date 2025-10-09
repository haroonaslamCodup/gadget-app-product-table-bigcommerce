import { useState } from "react";
import styled from "styled-components";
import { ProductImage } from "./ProductImage";
import { ProductPrice } from "./ProductPrice";
import { ProductStock } from "./ProductStock";
import { AddToCartButton } from "./AddToCartButton";

interface ExpandableProductRowProps {
  product: any;
  columns: string[];
  displayFormat?: "folded" | "unfolded" | "grouped";
}

export const ExpandableProductRow = ({ product, columns, displayFormat = "folded" }: ExpandableProductRowProps) => {
  // For unfolded mode, always show variants expanded
  const [isExpanded, setIsExpanded] = useState(displayFormat === "unfolded");
  const hasMultipleVariants = product.variants && product.variants.length > 1;

  const renderCell = (column: string, item: any, isVariant = false) => {
    switch (column) {
      case "image":
        return (
          <Td $isImage>
            <ProductImage
              src={item.image_url || item.images?.[0]?.url_thumbnail || item.images?.[0]?.url_standard}
              alt={item.name}
              size="small"
            />
          </Td>
        );
      case "sku":
        return <Td>{item.sku || "-"}</Td>;
      case "name":
        return (
          <Td $isIndented={isVariant}>
            {isVariant && <VariantIndent>↳</VariantIndent>}
            <div>
              <ProductLink href={product.custom_url?.url || `/products/${product.id}`}>
                {isVariant ? (
                  <>
                    {item.option_values && item.option_values.length > 0 ? (
                      <VariantName>
                        {item.option_values.map((opt: any) => opt.label).join(" / ")}
                      </VariantName>
                    ) : (
                      item.sku || "Variant"
                    )}
                  </>
                ) : (
                  product.name
                )}
              </ProductLink>
              {isVariant && item.option_values && (
                <VariantDetails>
                  {item.option_values.map((opt: any) => (
                    <span key={opt.id}>
                      {opt.option_display_name}: {opt.label}
                    </span>
                  )).reduce((prev: any, curr: any) => [prev, " • ", curr])}
                </VariantDetails>
              )}
            </div>
          </Td>
        );
      case "price":
        return (
          <Td>
            <ProductPrice
              basePrice={
                isVariant
                  ? (item.calculated_price ?? item.price ?? product.calculated_price ?? product.price)
                  : (product.calculated_price ?? product.price)
              }
              salePrice={
                isVariant
                  ? (item.calculated_sale_price ?? item.sale_price ?? product.calculated_sale_price ?? product.sale_price)
                  : (product.calculated_sale_price ?? product.sale_price)
              }
            />
          </Td>
        );
      case "stock":
        return (
          <Td>
            <ProductStock
              inventory={item.inventory_level !== undefined ? item.inventory_level : product.inventory_level}
              inventoryTracking={item.inventory_tracking || product.inventory_tracking}
            />
          </Td>
        );
      case "addToCart":
        // For variants, use product ID + variant ID
        // For products without variants, use product ID only
        return (
          <Td>
            <AddToCartButton
              productId={product.id}
              variantId={isVariant ? item.id : undefined}
              isAvailable={isVariant ? (item.availability === "available") : (product.availability === "available")}
              minQuantity={product.order_quantity_minimum}
              maxQuantity={product.order_quantity_maximum}
            />
          </Td>
        );
      case "description":
        return <Td><Description>{product.description?.substring(0, 100)}...</Description></Td>;
      case "category":
        return <Td>{product.categories?.[0]?.name || "-"}</Td>;
      case "brand":
        return <Td>{product.brand?.name || "-"}</Td>;
      case "weight":
        return <Td>{item.weight ? `${item.weight} lbs` : product.weight ? `${product.weight} lbs` : "-"}</Td>;
      default:
        return <Td>-</Td>;
    }
  };

  return (
    <>
      {/* Parent Product Row */}
      <TableRow
        $isExpanded={isExpanded}
      >
        {columns.map((column) => {
          if (column === "name") {
            return (
              <Td key={column} $hasVariants={hasMultipleVariants}>
                {/* Only show expand icon in folded mode */}
                {hasMultipleVariants && displayFormat === "folded" && (
                  <ExpandIcon
                    $isExpanded={isExpanded}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    {isExpanded ? "▼" : "▶"}
                  </ExpandIcon>
                )}
                <ProductLink href={product.custom_url?.url || `/products/${product.id}`}>
                  {product.name}
                  {hasMultipleVariants && <VariantCount> ({product.variants.length} variants)</VariantCount>}
                </ProductLink>
              </Td>
            );
          }
          // Hide add-to-cart button on parent row if product has multiple variants
          if (column === "addToCart" && hasMultipleVariants) {
            return <Td key={column}>-</Td>;
          }
          return renderCell(column, product, false);
        })}
      </TableRow>

      {/* Variant Rows */}
      {isExpanded && hasMultipleVariants && product.variants.map((variant: any) => (
        <VariantRow key={variant.id}>
          {columns.map((column) => renderCell(column, variant, true))}
        </VariantRow>
      ))}
    </>
  );
};

const TableRow = styled.tr<{ $isExpanded?: boolean }>`
  border-bottom: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  transition: background-color 0.2s;
  background-color: ${(props) => (props.$isExpanded ? "var(--color-greyLightest, #f9f9f9)" : "transparent")};

  &:hover {
    background-color: var(--color-greyLightest, #f9f9f9);
  }
`;

const VariantRow = styled.tr`
  border-bottom: 1px solid var(--color-greyLighter, #f3f3f3);
  background-color: var(--color-greyLightest, #fafafa);
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-greyLighter, #f3f3f3);
  }

  &:last-child {
    border-bottom: 1px solid var(--color-greyLight, #e0e0e0);
  }
`;

const Td = styled.td<{ $isImage?: boolean; $isIndented?: boolean; $hasVariants?: boolean }>`
  padding: ${(props) => (props.$isImage ? "0.5rem" : "var(--spacing-md, 1rem)")};
  padding-left: ${(props) => (props.$isIndented ? "3rem" : props.$hasVariants ? "0.5rem" : "var(--spacing-md, 1rem)")};
  vertical-align: middle;
  color: var(--color-textBase, var(--body-font-color, #333));
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  font-size: var(--fontSize-root, 1rem);

  @media (max-width: 768px) {
    padding: ${(props) => (props.$isImage ? "0.5rem" : "0.75rem 0.5rem")};
    padding-left: ${(props) => (props.$isIndented ? "2rem" : "0.5rem")};
  }
`;

const ExpandIcon = styled.span<{ $isExpanded: boolean }>`
  display: inline-block;
  width: 1.5rem;
  font-size: 0.75rem;
  color: var(--color-textSecondary, #666);
  transition: transform 0.2s;
  user-select: none;
  cursor: pointer;

  &:hover {
    color: var(--color-primary, #1a73e8);
  }
`;

const VariantIndent = styled.span`
  display: inline-block;
  width: 1.5rem;
  color: var(--color-textSecondary, #999);
  font-size: 1.2rem;
  margin-right: 0.5rem;
  user-select: none;
`;

const ProductLink = styled.a`
  color: var(--color-textLink, var(--color-primary, #1a73e8));
  text-decoration: none;
  font-weight: var(--fontWeight-medium, 500);

  &:hover {
    text-decoration: underline;
    color: var(--color-textLink-hover, var(--color-primaryHover, #0d47a1));
  }
`;

const VariantCount = styled.span`
  font-size: var(--fontSize-small, 0.875rem);
  color: var(--color-textSecondary, #666);
  font-weight: normal;
  margin-left: 0.5rem;
`;

const VariantName = styled.span`
  font-weight: var(--fontWeight-medium, 500);
  color: var(--color-textBase, #333);
`;

const VariantDetails = styled.div`
  font-size: var(--fontSize-small, 0.875rem);
  color: var(--color-textSecondary, #666);
  margin-top: 0.25rem;
  font-style: italic;

  span {
    white-space: nowrap;
  }
`;

const Description = styled.span`
  font-size: var(--fontSize-small, 0.875rem);
  color: var(--color-textSecondary, #666);
  display: block;
  max-width: 300px;
`;
