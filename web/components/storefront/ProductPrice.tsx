import styled from "styled-components";

interface ProductPriceProps {
  basePrice: number;
  salePrice?: number;
  customerGroup?: string;
  currency?: string;
}

export const ProductPrice = ({
  basePrice,
  salePrice,
  customerGroup,
  currency = "USD",
}: ProductPriceProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  const hasDiscount = salePrice && salePrice < basePrice;

  return (
    <PriceContainer>
      {hasDiscount ? (
        <>
          <SalePrice>{formatPrice(salePrice)}</SalePrice>
          <OriginalPrice>{formatPrice(basePrice)}</OriginalPrice>
        </>
      ) : (
        <CurrentPrice>{formatPrice(basePrice)}</CurrentPrice>
      )}
      {customerGroup && customerGroup !== "retail" && (
        <CustomerGroupBadge>{customerGroup}</CustomerGroupBadge>
      )}
    </PriceContainer>
  );
};

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const CurrentPrice = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: #333;
`;

const SalePrice = styled.span`
  font-size: 1.125rem;
  font-weight: 600;
  color: #d32f2f;
`;

const OriginalPrice = styled.span`
  font-size: 0.875rem;
  color: #999;
  text-decoration: line-through;
`;

const CustomerGroupBadge = styled.span`
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  text-transform: uppercase;
  font-weight: 500;
`;
