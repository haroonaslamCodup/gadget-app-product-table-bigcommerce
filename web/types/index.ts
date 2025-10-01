/**
 * Type definitions for Product Table Widget
 */

// Widget Configuration Types
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
  placementLocation?: "homepage" | "pdp" | "category" | "custom";
  version?: string;
  notes?: string;
  createdBy?: string;
  lastChecked?: string;
  pageBuilderId?: string;
  pageContext?: Record<string, unknown>;
}

// Widget Instance from API
export interface WidgetInstance extends WidgetConfig {
  id: string;
  createdAt: string;
  updatedAt: string;
  store?: {
    id: string;
    storeHash?: string;
  };
}

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
  images?: ProductImage[];
  variants?: ProductVariant[];
  categories?: ProductCategory[];
  brand?: ProductBrand;
  inventory_level?: number;
  inventory_tracking?: "none" | "product" | "variant";
  availability?: "available" | "disabled" | "preorder";
  base_variant_id?: number;
  product_id?: number;
  collections?: Array<{ id: string; name: string }>;
}

export interface ProductsResponse {
  products: Product[];
  meta: {
    pagination: {
      total: number;
      count: number;
      per_page: number;
      current_page: number;
      total_pages: number;
    };
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

// Collection Types
export interface Collection {
  id: string;
  name: string;
  description?: string;
  productCount?: number;
  imageUrl?: string;
  parentId?: string;
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

export interface WidgetListResponse {
  success: boolean;
  widgets: Array<{
    label: string;
    value: string;
    caption: string;
  }>;
}

export interface WidgetDetailResponse {
  success: boolean;
  widget: WidgetConfig;
}

// Page Context Types
export interface PageContext {
  categoryId?: string;
  productId?: string;
  pageType?: string;
}

// Filter Types
export interface ProductFilters {
  category?: string;
  collection?: string;
  userGroup?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
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
export interface WidgetFormData {
  widgetName: string;
  placementLocation: "homepage" | "pdp" | "category" | "custom";
  displayFormat: "folded" | "grouped-variants" | "grouped-category" | "grouped-collection";
  columns: string[];
  columnsOrder: string[];
  productSource: "all-collections" | "specific-collections" | "current-category";
  selectedCollections: string[];
  selectedCategories: string[];
  targetAllCustomers: boolean;
  targetRetailOnly: boolean;
  targetWholesaleOnly: boolean;
  targetLoggedInOnly: boolean;
  targetCustomerTags: string[];
  allowViewSwitching: boolean;
  defaultToTableView: boolean;
  enableCustomerSorting: boolean;
  defaultSort: "name" | "price-asc" | "price-desc" | "newest" | "oldest" | "sku";
  itemsPerPage: number;
  isActive: boolean;
  notes: string;
}

// Hook Return Types
export interface UseWidgetsReturn {
  data: WidgetInstance[] | undefined;
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
export interface CreateWidgetVariables {
  config: Partial<WidgetFormData>;
}

export interface UpdateWidgetVariables {
  id: string;
  config: Partial<WidgetFormData>;
}

export interface DeleteWidgetVariables {
  id: string;
}

// Error Types
export interface AppError {
  message: string;
  code?: string;
  details?: unknown;
}
