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
  gap: var(--spacing-md, 1rem);
  margin-top: var(--spacing-lg, 2rem);
  flex-wrap: wrap;
`;

const PageNumbers = styled.div`
  display: flex;
  gap: var(--spacing-sm, 0.5rem);
  align-items: center;
  flex-wrap: wrap;
`;

const PaginationButton = styled.button`
  padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
  background: var(--color-white, var(--button-default-backgroundColor, white));
  color: var(--color-primary, var(--button-default-color, #1a73e8));
  border: 1px solid var(--color-greyLight, var(--button-default-borderColor, #ddd));
  border-radius: var(--borderRadius-base, 4px);
  font-size: var(--fontSize-small, 0.875rem);
  font-weight: var(--fontWeight-medium, 500);
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: var(--color-greyLightest, #f5f5f5);
    border-color: var(--color-primary, #1a73e8);
  }

  &:disabled {
    color: var(--color-grey, #ccc);
    cursor: not-allowed;
    border-color: var(--color-greyLight, #e0e0e0);
  }

  @media (max-width: 768px) {
    padding: 0.375rem 0.75rem;
    font-size: 0.8125rem;
  }
`;

const PageButton = styled.button<{ $active?: boolean }>`
  min-width: 40px;
  height: 40px;
  padding: var(--spacing-sm, 0.5rem);
  background: ${(props) => (props.$active ? "var(--color-primary, var(--button-primary-backgroundColor, #1a73e8))" : "var(--color-white, var(--button-default-backgroundColor, white))")};
  color: ${(props) => (props.$active ? "var(--button-primary-color, white)" : "var(--color-textBase, #333)")};
  border: 1px solid ${(props) => (props.$active ? "var(--color-primary, #1a73e8)" : "var(--color-greyLight, var(--button-default-borderColor, #ddd))")};
  border-radius: var(--borderRadius-base, 4px);
  font-size: var(--fontSize-small, 0.875rem);
  font-weight: ${(props) => (props.$active ? "var(--fontWeight-semiBold, 600)" : "var(--fontWeight-normal, 400)")};
  font-family: var(--fontFamily-sans, var(--body-font-family, inherit));
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${(props) => (props.$active ? "var(--color-primaryHover, var(--button-primary-backgroundColorHover, #1557b0))" : "var(--color-greyLightest, #f5f5f5)")};
    border-color: var(--color-primary, #1a73e8);
  }

  @media (max-width: 768px) {
    min-width: 36px;
    height: 36px;
    font-size: 0.8125rem;
  }
`;

const Ellipsis = styled.span`
  padding: var(--spacing-sm, 0.5rem);
  color: var(--color-textSecondary, #666);
  user-select: none;
`;
