import { useState } from "react";
import styled from "styled-components";

interface AddToCartButtonProps {
  productId: number;
  variantId?: number;
  isAvailable: boolean;
  minQuantity?: number;
  maxQuantity?: number;
}

export const AddToCartButton = ({
  productId,
  variantId,
  isAvailable,
  minQuantity = 0,
  maxQuantity = 0,
}: AddToCartButtonProps) => {
  const defaultQuantity = minQuantity > 1 ? minQuantity : 1;
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const handleAddToCart = async () => {
    if (!isAvailable || isAdding) return;

    setIsAdding(true);

    try {
      // Use our Gadget API route to add to cart
      const response = await fetch("/api/add-to-cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          variantId,
          quantity,
        }),
      });

      if (response.ok) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        // Trigger cart update event for BigCommerce
        window.dispatchEvent(new CustomEvent("cart-quantity-update"));
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newQuantity = parseInt(e.target.value) || defaultQuantity;

    // Apply minimum constraint
    if (minQuantity > 0 && newQuantity < minQuantity) {
      newQuantity = minQuantity;
    }

    // Apply maximum constraint
    if (maxQuantity > 0 && newQuantity > maxQuantity) {
      newQuantity = maxQuantity;
    }

    setQuantity(Math.max(defaultQuantity, newQuantity));
  };

  const hasInventoryLimits = minQuantity > 0 || maxQuantity > 0;

  const getTooltipText = () => {
    if (!hasInventoryLimits) return "";

    const parts = [];
    if (minQuantity > 0) parts.push(`Min: ${minQuantity}`);
    if (maxQuantity > 0) parts.push(`Max: ${maxQuantity}`);

    return parts.join(" | ");
  };

  if (!isAvailable) {
    return <Button disabled>Out of Stock</Button>;
  }

  return (
    <Container>
      <QuantityWrapper
        onMouseEnter={() => hasInventoryLimits && setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <QuantityInput
          type="number"
          min={minQuantity > 0 ? minQuantity : 1}
          max={maxQuantity > 0 ? maxQuantity : undefined}
          value={quantity}
          onChange={handleQuantityChange}
          disabled={isAdding}
          title={getTooltipText()}
        />
        {hasInventoryLimits && showTooltip && (
          <Tooltip>{getTooltipText()}</Tooltip>
        )}
      </QuantityWrapper>
      <Button onClick={handleAddToCart} disabled={isAdding || isAdded} $isAdded={isAdded}>
        {isAdding ? "Adding..." : isAdded ? "Added!" : "Add to Cart"}
      </Button>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
  align-items: center;
`;

const QuantityWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const Tooltip = styled.div`
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 8px;
  padding: 6px 10px;
  background: var(--color-textBase, #333);
  color: white;
  font-size: var(--fontSize-smallest, 0.75rem);
  border-radius: var(--borderRadius-base, 4px);
  white-space: nowrap;
  z-index: 1000;
  box-shadow: var(--elevation-200, 0 2px 8px rgba(0, 0, 0, 0.2));
  pointer-events: none;

  &::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 5px solid transparent;
    border-top-color: var(--color-textBase, #333);
  }
`;

const QuantityInput = styled.input`
  width: 60px;
  padding: var(--spacing-sm, 0.5rem);
  border: 1px solid var(--color-greyLight, var(--input-border-color, #ddd));
  border-radius: var(--borderRadius-base, 4px);
  font-size: var(--fontSize-small, 0.875rem);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  color: var(--color-textBase, var(--input-font-color, #333));
  background: var(--color-white, var(--input-bg-color, white));
  text-align: center;

  &:focus {
    outline: none;
    border-color: var(--color-primary, var(--input-border-color-active, #1a73e8));
    box-shadow: 0 0 0 3px var(--color-primaryLight, rgba(26, 115, 232, 0.1));
  }

  &:disabled {
    background: var(--color-greyLighter, #f5f5f5);
    cursor: not-allowed;
  }
`;

const Button = styled.button<{ $isAdded?: boolean }>`
  padding: 0.625rem 1.25rem;
  background: ${(props) => (props.$isAdded ? "var(--color-success, #4caf50)" : "var(--button-primary-backgroundColor, var(--color-primary, #1a73e8))")};
  color: var(--button-primary-color, white);
  border: 1px solid ${(props) => (props.$isAdded ? "var(--color-success, #4caf50)" : "var(--button-primary-borderColor, transparent)")};
  border-radius: var(--borderRadius-base, 4px);
  font-size: var(--fontSize-small, 0.875rem);
  font-weight: var(--fontWeight-medium, 500);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: ${(props) => (props.$isAdded ? "var(--color-successDark, #45a049)" : "var(--button-primary-backgroundColorHover, var(--color-primaryHover, #1557b0))")};
    transform: translateY(-1px);
    box-shadow: var(--elevation-200, 0 2px 4px rgba(0, 0, 0, 0.2));
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    background: var(--color-grey, #ccc);
    border-color: var(--color-grey, #ccc);
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
`;
