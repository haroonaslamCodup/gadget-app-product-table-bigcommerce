/**
 * Type definitions for Product Table Widget
 */

// Product Table Configuration Types
export interface ProductTableConfig {
  productTableId: string;
  productTableName?: string;
  displayFormat?: "folded" | "unfolded" | "grouped";
  columns?: string[];
  columnsOrder?: string[];
  columnLabels?: Record<string, string>; // Custom labels for columns (e.g., { "name": "Product Title", "price": "Cost" })
  productSource?: "all-products" | "current-category" | "current-product-variants" | "specific-categories";
  selectedCategories?: string[];
  targetAllCustomers?: boolean;
  targetRetailOnly?: boolean;
  targetWholesaleOnly?: boolean;
  targetLoggedInOnly?: boolean;
  enableCustomerSorting?: boolean;
  defaultSort?: "name" | "price-asc" | "price-desc" | "newest" | "oldest" | "sku";
  itemsPerPage?: number;
  isActive?: boolean;
  placementLocation?: "homepage" | "pdp" | "category" | "custom";
  version?: string;
  notes?: string;
  createdBy?: string;
  lastChecked?: string;
  pageBuilderId?: string;
  pageContext?: Record<string, unknown>;
  // PDP Variant Settings
  showVariantsOnPDP?: boolean;
  variantColumns?: string[];
}

// Product Table Instance from API
export interface ProductTableInstance extends ProductTableConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    storeHash?: string;
  };
}

// Legacy type aliases for backward compatibility (will be removed in future)
/** @deprecated Use ProductTableConfig instead */
export type WidgetConfig = ProductTableConfig;
/** @deprecated Use ProductTableInstance instead */
export type WidgetInstance = ProductTableInstance;

// Product Types
export interface ProductImage {
  url_thumbnail?: string;
  url_standard?: string;
  url_zoom?: string;
  description?: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku?: string;
  price?: number;
  sale_price?: number;
  inventory_level?: number;
  option_values?: Array<{
    option_display_name: string;
    label: string;
  }>;
}

export interface ProductCategory {
  id: number;
  name: string;
}

export interface ProductBrand {
  id: number;
  name: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string;
  price: number;
  sale_price?: number;
  description?: string;
  weight?: number;
  custom_url?: {
    url: string;
    is_customized: boolean;
  };
  images?: ProductImage[];
  variants?: ProductVariant[];
  categories?: ProductCategory[];
  brand?: ProductBrand;
  inventory_level?: number;
  inventory_tracking?: "none" | "product" | "variant";
  availability?: "available" | "disabled" | "preorder";
  base_variant_id?: number;
  product_id?: number;
}

export interface ProductsResponse {
  products: Product[];
  pagination: {
    total: number;
    count: number;
    per_page: number;
    current_page: number;
    total_pages: number;
  };
}

// Customer Context Types
export interface CustomerContext {
  customerId?: string;
  customerGroup?: string;
  customerGroupId?: string;
  customerTags?: string[];
  isLoggedIn: boolean;
  isWholesale: boolean;
  email?: string;
  name?: string;
}

// Pricing Types
export interface PricingInfo {
  basePrice: number;
  salePrice?: number;
  customerGroupPrice?: number;
  currency: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ProductTableListResponse {
  success: boolean;
  productTables: Array<{
    label: string;
    value: string;
    caption: string;
  }>;
}

export interface ProductTableDetailResponse {
  success: boolean;
  productTable: ProductTableConfig;
}

// Legacy type aliases for backward compatibility (will be removed in future)
/** @deprecated Use ProductTableListResponse instead */
export type WidgetListResponse = ProductTableListResponse;
/** @deprecated Use ProductTableDetailResponse instead */
export type WidgetDetailResponse = ProductTableDetailResponse;

// Page Context Types
export interface PageContext {
  categoryId?: string;
  productId?: string;
  pageType?: string;
}

// Filter Types
export interface ProductFilters {
  category?: string;
  categories?: string;
  userGroup?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  productId?: string;
  includeVariants?: string;
}

// Store Types
export interface Store {
  id: string;
  storeHash?: string;
  name?: string;
  domain?: string;
}

// Column Types
export type ColumnType =
  | "image"
  | "sku"
  | "name"
  | "price"
  | "stock"
  | "addToCart"
  | "description"
  | "category"
  | "brand"
  | "weight";

export interface ColumnDefinition {
  id: ColumnType;
  label: string;
  sortable?: boolean;
  required?: boolean;
}

// Form Types
export interface ProductTableFormData {
  productTableName: string;
  placementLocation: "homepage" | "pdp" | "category" | "custom";
  displayFormat: "folded" | "unfolded" | "grouped";
  columns: string[];
  columnsOrder: string[];
  columnLabels: Record<string, string>; // Custom labels for columns
  productSource: "all-products" | "current-category" | "current-product-variants" | "specific-categories";
  selectedCategories: string[];
  targetAllCustomers: boolean;
  targetRetailOnly: boolean;
  targetWholesaleOnly: boolean;
  targetLoggedInOnly: boolean;
  enableCustomerSorting: boolean;
  defaultSort: "name" | "price-asc" | "price-desc" | "newest" | "oldest" | "sku";
  itemsPerPage: number;
  isActive: boolean;
  notes: string;
  // PDP Variant Settings
  showVariantsOnPDP: boolean;
  variantColumns: string[];
}

// Legacy type alias for backward compatibility (will be removed in future)
/** @deprecated Use ProductTableFormData instead */
export type WidgetFormData = ProductTableFormData;

// Hook Return Types
export interface UseProductTablesReturn {
  data: ProductTableInstance[] | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseProductsReturn {
  data: ProductsResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface UseCustomerContextReturn {
  data: CustomerContext | undefined;
  isLoading: boolean;
  error: Error | null;
}

// Mutation Types
export interface CreateProductTableVariables {
  config: Partial<ProductTableFormData>;
}

export interface UpdateProductTableVariables {
  id: string;
  config: Partial<ProductTableFormData>;
}

export interface DeleteProductTableVariables {
  id: string;
}

// Legacy type aliases for backward compatibility (will be removed in future)
/** @deprecated Use UseProductTablesReturn instead */
export type UseWidgetsReturn = UseProductTablesReturn;
/** @deprecated Use CreateProductTableVariables instead */
export type CreateWidgetVariables = CreateProductTableVariables;
/** @deprecated Use UpdateProductTableVariables instead */
export type UpdateWidgetVariables = UpdateProductTableVariables;
/** @deprecated Use DeleteProductTableVariables instead */
export type DeleteWidgetVariables = DeleteProductTableVariables;

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}
