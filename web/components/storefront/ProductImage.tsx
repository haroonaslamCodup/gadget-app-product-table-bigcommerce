import styled from "styled-components";

interface ProductImageProps {
  src?: string;
  alt: string;
  size?: "small" | "medium" | "large";
}

export const ProductImage = ({ src, alt, size = "medium" }: ProductImageProps) => {
  const placeholderSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

  return (
    <ImageContainer $size={size}>
      <Image src={src || placeholderSrc} alt={alt} loading="lazy" />
    </ImageContainer>
  );
};

const ImageContainer = styled.div<{ $size: string }>`
  width: ${(props) =>
    props.$size === "small" ? "60px" : props.$size === "large" ? "100%" : "80px"};
  height: ${(props) =>
    props.$size === "small" ? "60px" : props.$size === "large" ? "auto" : "80px"};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: ${(props) => (props.$size === "large" ? "8px 8px 0 0" : "4px")};
  background: #f5f5f5;
`;

const Image = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;
