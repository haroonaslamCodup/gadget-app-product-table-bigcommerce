import styled from "styled-components";

interface ProductStockProps {
  inventory?: number;
  inventoryTracking?: string;
}

export const ProductStock = ({ inventory, inventoryTracking }: ProductStockProps) => {
  if (inventoryTracking === "none") {
    return <StockBadge $status="in-stock">In Stock</StockBadge>;
  }

  if (inventory === undefined || inventory === null) {
    return <StockBadge $status="unknown">Check Availability</StockBadge>;
  }

  if (inventory === 0) {
    return <StockBadge $status="out-of-stock">Out of Stock</StockBadge>;
  }

  if (inventory <= 5) {
    return (
      <StockBadge $status="low-stock">
        Low Stock ({inventory} left)
      </StockBadge>
    );
  }

  return <StockBadge $status="in-stock">In Stock ({inventory})</StockBadge>;
};

const StockBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 0.375rem var(--spacing-sm, 0.75rem);
  border-radius: var(--borderRadius-base, 4px);
  font-size: var(--fontSize-small, 0.875rem);
  font-weight: var(--fontWeight-medium, 500);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  white-space: nowrap;

  background: ${(props) => {
    switch (props.$status) {
      case "in-stock":
        return "var(--color-successLight, #e8f5e9)";
      case "low-stock":
        return "var(--color-warningLight, #fff3e0)";
      case "out-of-stock":
        return "var(--color-errorLight, #ffebee)";
      default:
        return "var(--color-greyLighter, #f5f5f5)";
    }
  }};

  color: ${(props) => {
    switch (props.$status) {
      case "in-stock":
        return "var(--color-successDark, #2e7d32)";
      case "low-stock":
        return "var(--color-warningDark, #f57c00)";
      case "out-of-stock":
        return "var(--color-errorDark, #c62828)";
      default:
        return "var(--color-textSecondary, #666)";
    }
  }};
`;
