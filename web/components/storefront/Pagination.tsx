import styled from "styled-components";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({ currentPage, totalPages, onPageChange }: PaginationProps) => {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const pages = getPageNumbers();

  return (
    <PaginationContainer>
      <PaginationButton
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        Previous
      </PaginationButton>

      <PageNumbers>
        {pages.map((page, index) =>
          typeof page === "number" ? (
            <PageButton
              key={`${page}-${index}`}
              onClick={() => onPageChange(page)}
              $active={currentPage === page}
            >
              {page}
            </PageButton>
          ) : (
            <Ellipsis key={`ellipsis-${index}`}>{page}</Ellipsis>
          )
        )}
      </PageNumbers>

      <PaginationButton
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next
      </PaginationButton>
    </PaginationContainer>
  );
};

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
`;

const PageNumbers = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: 0.5rem 1rem;
  background: white;
  color: #1a73e8;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: #f5f5f5;
    border-color: #1a73e8;
  }

  &:disabled {
    color: #ccc;
    cursor: not-allowed;
    border-color: #e0e0e0;
  }

  @media (max-width: 768px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: 0.5rem;
  background: ${(props) => (props.$active ? "#1a73e8" : "white")};
  color: ${(props) => (props.$active ? "white" : "#333")};
  border: 1px solid ${(props) => (props.$active ? "#1a73e8" : "#ddd")};
  border-radius: 4px;
  font-size: 0.875rem;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "#1557b0" : "#f5f5f5")};
    border-color: #1a73e8;
  }

  @media (max-width: 768px) {
    min-width: 36px;
    height: 36px;
    font-size: 0.8125rem;
  }
`;

const Ellipsis = styled.span`
  padding: 0.5rem;
  color: #666;
  user-select: none;
`;
