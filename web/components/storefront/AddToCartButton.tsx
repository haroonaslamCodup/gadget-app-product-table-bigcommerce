import { useState } from "react";
import styled from "styled-components";

interface AddToCartButtonProps {
  productId: number;
  variantId?: number;
  isAvailable: boolean;
}

export const AddToCartButton = ({
  productId,
  variantId,
  isAvailable,
}: AddToCartButtonProps) => {
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isAdded, setIsAdded] = useState(false);

  const handleAddToCart = async () => {
    if (!isAvailable || isAdding) return;

    setIsAdding(true);

    try {
      // Use BigCommerce Storefront API to add to cart
      const response = await fetch("/api/storefront/cart/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lineItems: [
            {
              productId,
              variantId,
              quantity,
            },
          ],
        }),
      });

      if (response.ok) {
        setIsAdded(true);
        setTimeout(() => setIsAdded(false), 2000);

        // Trigger cart update event for BigCommerce
        window.dispatchEvent(new CustomEvent("cart-quantity-update"));
      }
    } catch (error) {
      // Silently fail
    } finally {
      setIsAdding(false);
    }
  };

  if (!isAvailable) {
    return <Button disabled>Out of Stock</Button>;
  }

  return (
    <Container>
      <QuantityInput
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
        disabled={isAdding}
      />
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
