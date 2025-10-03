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
  gap: var(--spacing-sm, 0.5rem);
  flex-wrap: wrap;
`;

const CurrentPrice = styled.span`
  font-size: var(--fontSize-large, 1.125rem);
  font-weight: var(--fontWeight-semiBold, 600);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-textBase, var(--price-font-color, #333));
`;

const SalePrice = styled.span`
  font-size: var(--fontSize-large, 1.125rem);
  font-weight: var(--fontWeight-semiBold, 600);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-error, var(--price-sale-font-color, #d32f2f));
`;

const OriginalPrice = styled.span`
  font-size: var(--fontSize-small, 0.875rem);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-textSecondary, var(--price-non-sale-font-color, #999));
  text-decoration: line-through;
`;

const CustomerGroupBadge = styled.span`
  font-size: var(--fontSize-smallest, 0.75rem);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm, 0.5rem);
  background: var(--color-infoLight, #e3f2fd);
  color: var(--color-info, #1976d2);
  border-radius: var(--borderRadius-base, 4px);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  text-transform: uppercase;
  font-weight: var(--fontWeight-medium, 500);
`;
