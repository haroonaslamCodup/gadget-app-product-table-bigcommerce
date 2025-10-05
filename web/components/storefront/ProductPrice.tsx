import styled from "styled-components";

interface ProductPriceProps {
  basePrice: number;
  salePrice?: number;
  currency?: string;
}

export const ProductPrice = ({
  basePrice,
  salePrice,
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
