import { useState, useMemo } from "react";
import styled from "styled-components";
import { useProducts } from "../../hooks/useProducts";
import { useCustomerContext } from "../../hooks/useCustomer";
import { ProductTableHeader } from "./ProductTableHeader";
import { ProductTableRow } from "./ProductTableRow";
import { Pagination } from "./Pagination";
import { SearchFilter } from "./SearchFilter";
import { ViewSwitcher } from "./ViewSwitcher";
import { GroupedView } from "./GroupedView";

export interface WidgetConfig {
  widgetId: string;
  widgetName?: string;
  displayFormat?: "folded" | "grouped-variants" | "grouped-category" | "grouped-collection";
  columns?: string[];
  columnsOrder?: string[];
  productSource?: "all-collections" | "specific-collections" | "current-category";
  selectedCollections?: string[];
  selectedCategories?: string[];
  targetAllCustomers?: boolean;
  targetRetailOnly?: boolean;
  targetWholesaleOnly?: boolean;
  targetLoggedInOnly?: boolean;
  targetCustomerTags?: string[];
  allowViewSwitching?: boolean;
  defaultToTableView?: boolean;
  enableCustomerSorting?: boolean;
  defaultSort?: "name" | "price-asc" | "price-desc" | "newest" | "oldest" | "sku";
  itemsPerPage?: number;
  isActive?: boolean;
}

interface ProductTableProps {
  config: WidgetConfig;
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
    config.defaultToTableView ? "table" : "grid"
  );

  const { data: customerContext } = useCustomerContext();

  // Check widget visibility based on customer targeting
  const isVisible = useMemo(() => {
    if (!config.isActive) return false;

    if (config.targetAllCustomers) return true;

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

    if (config.productSource === "specific-collections" && config.selectedCollections) {
      filters.collection = config.selectedCollections.join(",");
    } else if (config.productSource === "current-category" && pageContext?.categoryId) {
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
  const totalProducts = productsData?.meta?.pagination?.total || 0;
  const totalPages = Math.ceil(totalProducts / (config.itemsPerPage || 25));

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
        {config.allowViewSwitching && (
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
              onSort={config.enableCustomerSorting ? setSortBy : undefined}
              currentSort={sortBy}
            />
            <tbody>
              {products.map((product: any) => (
                <ProductTableRow
                  key={product.id}
                  product={product}
                  columns={columns}
                  customerContext={customerContext}
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
              customerContext={customerContext}
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

// Styled Components
const WidgetContainer = styled.div`
  width: 100%;
  margin: 2rem 0;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
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
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;

  @media (max-width: 768px) {
    min-width: 100%;
    font-size: 0.875rem;
  }
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 1rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  gap: 1rem;
`;

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const LoadingText = styled.p`
  color: #666;
  font-size: 1rem;
`;

const EmptyState = styled.div`
  padding: 4rem 2rem;
  text-align: center;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
`;

const EmptyText = styled.p`
  color: #666;
  font-size: 1.125rem;
`;

const ErrorContainer = styled.div`
  padding: 2rem;
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  margin: 2rem 0;
`;

const ErrorMessage = styled.p`
  color: #c33;
  font-size: 1rem;
  margin: 0;
`;
