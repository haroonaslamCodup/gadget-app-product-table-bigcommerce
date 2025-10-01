import styled from "styled-components";

interface ProductTableHeaderProps {
  columns: string[];
  onSort?: (sortBy: string) => void;
  currentSort?: string;
}

const columnLabels: Record<string, string> = {
  image: "Image",
  sku: "SKU",
  name: "Product Name",
  price: "Price",
  stock: "Stock",
  addToCart: "Add to Cart",
  description: "Description",
  category: "Category",
  brand: "Brand",
  weight: "Weight",
};

const sortableColumns = ["name", "price", "sku"];

export const ProductTableHeader = ({
  columns,
  onSort,
  currentSort,
}: ProductTableHeaderProps) => {
  const handleSort = (column: string) => {
    if (!onSort || !sortableColumns.includes(column)) return;

    // Toggle between asc and desc for price
    if (column === "price") {
      const newSort = currentSort === "price-asc" ? "price-desc" : "price-asc";
      onSort(newSort);
    } else {
      onSort(column);
    }
  };

  const getSortIcon = (column: string) => {
    if (!sortableColumns.includes(column)) return null;

    const isActive =
      currentSort === column ||
      (column === "price" && (currentSort === "price-asc" || currentSort === "price-desc"));

    if (!isActive) return <SortIcon>⇅</SortIcon>;

    if (column === "price") {
      return currentSort === "price-asc" ? <SortIcon>↑</SortIcon> : <SortIcon>↓</SortIcon>;
    }

    return <SortIcon>↑</SortIcon>;
  };

  return (
    <TableHead>
      <tr>
        {columns.map((column) => (
          <Th
            key={column}
            $sortable={sortableColumns.includes(column) && !!onSort}
            onClick={() => handleSort(column)}
            $isImage={column === "image"}
          >
            {columnLabels[column] || column}
            {onSort && getSortIcon(column)}
          </Th>
        ))}
      </tr>
    </TableHead>
  );
};

const TableHead = styled.thead`
  background: #f5f5f5;
  border-bottom: 2px solid #ddd;
`;

const Th = styled.th<{ $sortable?: boolean; $isImage?: boolean }>`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #333;
  white-space: nowrap;
  cursor: ${(props) => (props.$sortable ? "pointer" : "default")};
  user-select: none;
  width: ${(props) => (props.$isImage ? "80px" : "auto")};

  &:hover {
    background: ${(props) => (props.$sortable ? "#ebebeb" : "transparent")};
  }

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.75rem;
  }
`;

const SortIcon = styled.span`
  margin-left: 0.5rem;
  opacity: 0.5;
  font-size: 0.875rem;
`;
