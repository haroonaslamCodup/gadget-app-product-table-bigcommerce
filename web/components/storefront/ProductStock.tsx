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
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;

  background: ${(props) => {
    switch (props.$status) {
      case "in-stock":
        return "#e8f5e9";
      case "low-stock":
        return "#fff3e0";
      case "out-of-stock":
        return "#ffebee";
      default:
        return "#f5f5f5";
    }
  }};

  color: ${(props) => {
    switch (props.$status) {
      case "in-stock":
        return "#2e7d32";
      case "low-stock":
        return "#f57c00";
      case "out-of-stock":
        return "#c62828";
      default:
        return "#666";
    }
  }};
`;
