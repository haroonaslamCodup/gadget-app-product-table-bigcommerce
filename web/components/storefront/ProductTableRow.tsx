import styled from "styled-components";
import { ProductImage } from "./ProductImage";
import { ProductPrice } from "./ProductPrice";
import { ProductStock } from "./ProductStock";
import { AddToCartButton } from "./AddToCartButton";

interface ProductTableRowProps {
  product: any;
  columns: string[];
  customerContext?: any;
  viewMode?: "table" | "grid";
}

export const ProductTableRow = ({
  product,
  columns,
  customerContext,
  viewMode = "table",
}: ProductTableRowProps) => {
  if (viewMode === "grid") {
    return (
      <GridCard>
        {columns.includes("image") && (
          <ProductImage
            src={product.images?.[0]?.url_thumbnail || product.images?.[0]?.url_standard}
            alt={product.name}
            size="large"
          />
        )}
        <CardContent>
          {columns.includes("name") && <ProductName>{product.name}</ProductName>}
          {columns.includes("sku") && <ProductSKU>SKU: {product.sku}</ProductSKU>}
          {columns.includes("price") && (
            <ProductPrice
              basePrice={product.price}
              salePrice={product.sale_price}
              customerGroup={customerContext?.customerGroup}
            />
          )}
          {columns.includes("stock") && (
            <ProductStock
              inventory={product.inventory_level}
              inventoryTracking={product.inventory_tracking}
            />
          )}
          {columns.includes("addToCart") && (
            <AddToCartButton
              productId={product.id}
              variantId={product.variants?.[0]?.id}
              isAvailable={product.availability === "available"}
            />
          )}
        </CardContent>
      </GridCard>
    );
  }

  // Table view
  return (
    <TableRow>
      {columns.map((column) => (
        <Td key={column} $isImage={column === "image"}>
          {column === "image" && (
            <ProductImage
              src={product.images?.[0]?.url_thumbnail || product.images?.[0]?.url_standard}
              alt={product.name}
              size="small"
            />
          )}
          {column === "sku" && <span>{product.sku}</span>}
          {column === "name" && <ProductLink href={`/products/${product.id}`}>{product.name}</ProductLink>}
          {column === "price" && (
            <ProductPrice
              basePrice={product.price}
              salePrice={product.sale_price}
              customerGroup={customerContext?.customerGroup}
            />
          )}
          {column === "stock" && (
            <ProductStock
              inventory={product.inventory_level}
              inventoryTracking={product.inventory_tracking}
            />
          )}
          {column === "addToCart" && (
            <AddToCartButton
              productId={product.id}
              variantId={product.variants?.[0]?.id}
              isAvailable={product.availability === "available"}
            />
          )}
          {column === "description" && (
            <Description>{product.description?.substring(0, 100)}...</Description>
          )}
          {column === "category" && <span>{product.categories?.[0]?.name || "-"}</span>}
          {column === "brand" && <span>{product.brand?.name || "-"}</span>}
          {column === "weight" && <span>{product.weight ? `${product.weight} lbs` : "-"}</span>}
        </Td>
      ))}
    </TableRow>
  );
};

const TableRow = styled.tr`
  border-bottom: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  transition: background-color 0.2s;

  &:hover {
    background-color: var(--color-greyLightest, #f9f9f9);
  }
`;

const Td = styled.td<{ $isImage?: boolean }>`
  padding: ${(props) => (props.$isImage ? "0.5rem" : "var(--spacing-md, 1rem)")};
  vertical-align: middle;
  color: var(--color-textBase, var(--body-font-color, #333));
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  font-size: var(--fontSize-root, 1rem);

  @media (max-width: 768px) {
    padding: ${(props) => (props.$isImage ? "0.5rem" : "0.75rem 0.5rem")};
  }
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

const Description = styled.span`
  font-size: var(--fontSize-small, 0.875rem);
  color: var(--color-textSecondary, #666);
  display: block;
  max-width: 300px;
`;

const GridCard = styled.div`
  border: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  border-radius: var(--borderRadius-base, 8px);
  overflow: hidden;
  background: var(--color-white, var(--container-fill-base, white));
  transition: box-shadow 0.2s, transform 0.2s;
  box-shadow: var(--elevation-100, 0 2px 4px rgba(0,0,0,0.1));

  &:hover {
    box-shadow: var(--elevation-200, 0 4px 12px rgba(0, 0, 0, 0.15));
    transform: translateY(-2px);
  }
`;

const CardContent = styled.div`
  padding: var(--spacing-md, 1rem);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm, 0.5rem);
`;

const ProductName = styled.h3`
  font-size: var(--fontSize-root, 1rem);
  font-weight: var(--fontWeight-semiBold, 600);
  margin: 0;
  color: var(--color-textBase, var(--body-font-color, #333));
  line-height: 1.4;
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
`;

const ProductSKU = styled.p`
  font-size: var(--fontSize-smallest, 0.75rem);
  color: var(--color-textSecondary, #666);
  margin: 0;
`;
