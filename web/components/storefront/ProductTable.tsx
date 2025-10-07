import { useMemo, useState } from "react";
import styled from "styled-components";
import { useCustomerContext } from "../../hooks/useCustomer";
import { useProducts } from "../../hooks/useProducts";
import { ExpandableProductRow } from "./ExpandableProductRow";
import { GroupedView } from "./GroupedView";
import { Pagination } from "./Pagination";
import { ProductTableHeader } from "./ProductTableHeader";
import { ProductTableRow } from "./ProductTableRow";
import { SearchFilter } from "./SearchFilter";
import { ViewSwitcher } from "./ViewSwitcher";

import type { ProductTableConfig } from "../../types";

interface ProductTableProps {
  config: ProductTableConfig;
  pageContext?: {
    categoryId?: string;
    productId?: string;
    pageType?: string;
  };
}

export const ProductTable = ({ config, pageContext }: ProductTableProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState(config.defaultSort || "name");
  const [viewMode, setViewMode] = useState<"table" | "grid">(
    config.defaultToTableView !== false ? "table" : "grid" // Default to table view
  );

  const { data: customerContext } = useCustomerContext();

  // Check widget visibility based on customer targeting
  const isVisible = useMemo(() => {
    // Default to active if not specified
    const isActive = config.isActive !== false;

    if (!isActive) {
      return false;
    }

    // Default to targeting all customers if no specific targeting is set
    const targetAllCustomers = config.targetAllCustomers !== false;
    const hasSpecificTargeting = config.targetLoggedInOnly || config.targetRetailOnly ||
      config.targetWholesaleOnly ||
      (config.targetCustomerTags && config.targetCustomerTags.length > 0);

    if (targetAllCustomers && !hasSpecificTargeting) {
      return true;
    }

    if (config.targetLoggedInOnly && !customerContext?.isLoggedIn) {
      return false;
    }

    if (config.targetRetailOnly && customerContext?.isWholesale) {
      return false;
    }

    if (config.targetWholesaleOnly && !customerContext?.isWholesale) {
      return false;
    }

    if (config.targetCustomerTags && config.targetCustomerTags.length > 0) {
      const customerTags = customerContext?.customerTags || [];
      const hasMatchingTag = config.targetCustomerTags.some(tag =>
        customerTags.includes(tag)
      );
      if (!hasMatchingTag) return false;
    }

    return true;
  }, [config, customerContext]);

  // Determine product source based on config and page context
  const productFilters = useMemo(() => {
    const filters: any = {
      page: currentPage,
      limit: config.itemsPerPage || 25,
      sort: sortBy,
      search: searchQuery,
    };

    if (config.productSource === "current-category" && pageContext?.categoryId) {
      filters.category = pageContext.categoryId;
    }

    if (customerContext?.customerGroupId) {
      filters.userGroup = customerContext.customerGroupId;
    }

    return filters;
  }, [config, pageContext, currentPage, sortBy, searchQuery, customerContext]);

  const { data: productsData, isLoading, error } = useProducts(productFilters);

  if (!isVisible) return null;

  if (error) {
    return (
      <ErrorContainer>
        <ErrorMessage>Unable to load products. Please try again later.</ErrorMessage>
      </ErrorContainer>
    );
  }

  const products = productsData?.products || [];
  const totalProducts = productsData?.pagination?.total || productsData?.products?.length || 0;
  const totalPages = productsData?.pagination?.total_pages || Math.ceil(totalProducts / (config.itemsPerPage || 25));

  const columns = config.columnsOrder || config.columns || [
    "image",
    "sku",
    "name",
    "price",
    "stock",
    "addToCart",
  ];

  // Render grouped view if display format is grouped
  if (config.displayFormat?.startsWith("grouped-")) {
    return (
      <WidgetContainer>
        {config.allowViewSwitching && (
          <ControlsRow>
            <SearchFilter value={searchQuery} onChange={setSearchQuery} />
            <ViewSwitcher mode={viewMode} onChange={setViewMode} />
          </ControlsRow>
        )}

        <GroupedView
          products={products}
          displayFormat={config.displayFormat}
          columns={columns}
          isLoading={isLoading}
        />

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </WidgetContainer>
    );
  }

  // Standard table view
  return (
    <WidgetContainer>
      <ControlsRow>
        <SearchFilter value={searchQuery} onChange={setSearchQuery} />
        {(config.allowViewSwitching !== false) && (
          <ViewSwitcher mode={viewMode} onChange={setViewMode} />
        )}
      </ControlsRow>

      {isLoading ? (
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Loading products...</LoadingText>
        </LoadingContainer>
      ) : products.length === 0 ? (
        <EmptyState>
          <EmptyText>No products found</EmptyText>
        </EmptyState>
      ) : viewMode === "table" ? (
        <TableContainer>
          <Table>
            <ProductTableHeader
              columns={columns}
              onSort={config.enableCustomerSorting ? ((sort: string) => setSortBy(sort as any)) : undefined}
              currentSort={sortBy}
            />
            <tbody>
              {products.map((product: any) => (
                <ExpandableProductRow
                  key={product.id}
                  product={product}
                  columns={columns}
                />
              ))}
            </tbody>
          </Table>
        </TableContainer>
      ) : (
        <GridContainer>
          {products.map((product: any) => (
            <ProductTableRow
              key={product.id}
              product={product}
              columns={columns}
              viewMode="grid"
            />
          ))}
        </GridContainer>
      )}

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </WidgetContainer>
  );
};

// Styled Components using BigCommerce theme variables
const WidgetContainer = styled.div`
  width: 100%;
  margin: 2rem 0;
  font-family: var(--fontFamily-sans, var(--body-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif));
  color: var(--color-textBase, var(--body-font-color, #333));
  font-size: var(--fontSize-root, 1rem);
`;

const ControlsRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const TableContainer = styled.div`
  width: 100%;
  overflow-x: auto;
  border: 1px solid var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0));
  border-radius: var(--borderRadius-base, 4px);
  background: var(--color-white, var(--container-fill-base, #ffffff));
  box-shadow: var(--elevation-100, 0 2px 4px rgba(0,0,0,0.1));
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
  font-family: inherit;
  color: inherit;

  @media (max-width: 768px) {
    min-width: 100%;
    font-size: 0.875rem;
  }
`;

const GridContainer = styled.div`

`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
  color: var(--color-textSecondary, #666);
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-greyLighter, #f3f3f3);
  border-top: 4px solid var(--color-primary, var(--button-primary-backgroundColor, #3498db));
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: var(--color-textSecondary, #666);
  font-size: 1rem;
  margin: 0;
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  border: 1px solid var(--color-greyLight, #e0e0e0);
  border-radius: var(--borderRadius-base, 4px);
  background: var(--color-white, #ffffff);
`;

const EmptyText = styled.p`
  color: var(--color-textSecondary, #666);
  font-size: 1.125rem;
  margin: 0;
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: var(--color-errorLight, #fee);
  border: 1px solid var(--color-error, #fcc);
  border-radius: var(--borderRadius-base, 4px);
  margin: 2rem 0;
`;

const ErrorMessage = styled.p`
  color: var(--color-error, #c33);
  font-size: 1rem;
  margin: 0;
  margin: 0;
`;
