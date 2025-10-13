/**
 * BigCommerce Page Builder Product Table Loader
 *
 * This script initializes product tables on the storefront.
 * It should be loaded via BigCommerce Page Builder configuration.
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createRoot } from "react-dom/client";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ProductTable } from "../components/storefront/ProductTable";

// Get the Gadget app URL from the script tag
// Look for the script tag that loaded widget-loader.js
const getGadgetAppUrl = () => {
  const scripts = document.querySelectorAll('script[src*="widget-loader.js"]');
  if (scripts.length > 0) {
    const scriptSrc = (scripts[0] as HTMLScriptElement).src;
    const url = new URL(scriptSrc);
    return url.origin;
  }

  // Fallback: try to detect from current script during initial execution
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript?.src) {
    const url = new URL(currentScript.src);
    return url.origin;
  }

  // Last resort: use window location (this will fail on storefront)
  return window.location.origin;
};

const gadgetAppUrl = getGadgetAppUrl();

// Store API base URL globally so hooks can access it
(window as any).__GADGET_API_URL__ = gadgetAppUrl;

// Initialize Query Client for storefront
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

interface ProductTableConfig {
  productTableId: string;
  containerId?: string;
  // All other product table configuration fields
  [key: string]: any;
}

/**
 * Initialize a product table
 */
export const initProductTableWidget = (config: ProductTableConfig) => {
  const containerId = config.containerId || `product-table-${config.productTableId}`;
  const container = document.getElementById(containerId);

  if (!container) {
    return;
  }

  // Get page context from multiple sources
  const getProductId = () => {
    // Try data attribute first (BigCommerce uses data-entity-id)
    const dataAttr = document.querySelector('[data-entity-id]')?.getAttribute('data-entity-id');
    if (dataAttr) return dataAttr;

    // Try window.BCData (BigCommerce global) - most reliable
    if (typeof window !== 'undefined' && (window as any).BCData?.product_id) {
      return String((window as any).BCData.product_id);
    }

    // Try meta tag
    const metaTag = document.querySelector('meta[property="product:id"]');
    if (metaTag) return metaTag.getAttribute('content') || undefined;

    // Try URL pattern (e.g., /products/product-name-123/)
    const urlMatch = window.location.pathname.match(/\/products\/[^\/]+-(\d+)\//);
    if (urlMatch && urlMatch[1]) return urlMatch[1];

    // Try entity ID from body class (some themes)
    const bodyClasses = document.body.className;
    const entityMatch = bodyClasses.match(/productId-(\d+)/);
    if (entityMatch && entityMatch[1]) return entityMatch[1];

    return undefined;
  };

  const getCategoryIdSync = () => {
    // Try data attribute first (manual override)
    const dataAttr = document.querySelector('[data-category-id]')?.getAttribute('data-category-id');
    if (dataAttr) {
      return dataAttr;
    }

    // Try window.BCData (most reliable for BigCommerce - when available)
    if (typeof window !== 'undefined' && (window as any).BCData?.category_id) {
      const categoryId = String((window as any).BCData.category_id);
      return categoryId;
    }

    // Try body element data attribute
    const bodyDataCategoryId = document.body.getAttribute('data-category-id');
    if (bodyDataCategoryId) {
      return bodyDataCategoryId;
    }

    // Try page body class with various formats (some themes)
    const bodyClasses = document.body.className;

    // Format: categoryId--123
    const categoryMatch1 = bodyClasses.match(/categoryId--(\d+)/);
    if (categoryMatch1 && categoryMatch1[1]) {
      return categoryMatch1[1];
    }

    // Format: category-123 or cat-123
    const categoryMatch2 = bodyClasses.match(/(?:category|cat)-(\d+)/);
    if (categoryMatch2 && categoryMatch2[1]) {
      return categoryMatch2[1];
    }

    // Try meta tag
    const metaCategory = document.querySelector('meta[name="category-id"]') ||
      document.querySelector('meta[property="category:id"]');
    if (metaCategory) {
      const categoryId = metaCategory.getAttribute('content');
      if (categoryId) {
        return categoryId;
      }
    }

    // Try finding category link in breadcrumbs
    const breadcrumbLink = document.querySelector('a[href*="/garden/"], a[href*="/category/"]');
    if (breadcrumbLink) {
      const href = breadcrumbLink.getAttribute('href') || '';
      const urlCategoryMatch = href.match(/\/(?:garden|category)\/([^\/]+)/);
      if (urlCategoryMatch) {
        // Found category in breadcrumb, but cannot get numeric ID
      }
    }

    return undefined;
  };

  // Async function to resolve category ID from URL if BCData is not available
  const getCategoryIdAsync = async (): Promise<string | undefined> => {
    // First try synchronous detection
    const syncId = getCategoryIdSync();
    if (syncId) return syncId;

    // If no category ID found and we're likely on a category page, try API resolution
    const pathname = window.location.pathname;
    const isLikelyCategoryPage = /^\/(garden|shop|category|products|collection|[^\/]+)\/$/.test(pathname);

    if (!isLikelyCategoryPage) {
      return undefined;
    }

    // Check localStorage cache (5 minute TTL)
    const cacheKey = `ptw_category_${pathname}`;
    const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { categoryId, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return categoryId;
        }
      }
    } catch (e) {
      // localStorage might be disabled or full
    }

    try {

      const baseUrl = (window as any).__GADGET_API_URL__ || window.location.origin;
      const apiUrl = `${baseUrl}/api/resolve-category?url=${encodeURIComponent(pathname)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();

      if (data.success && data.categoryId) {
        // Cache the result
        try {
          localStorage.setItem(cacheKey, JSON.stringify({
            categoryId: data.categoryId,
            categoryName: data.categoryName,
            timestamp: Date.now()
          }));
        } catch (e) {
          // localStorage might be disabled or full
        }

        return data.categoryId;
      }
    } catch (error) {
      // Silent fail
    }

    return undefined;
  };

  // Get initial page context (synchronous)
  const initialPageContext = {
    categoryId: config.pageContext?.categoryId || getCategoryIdSync(),
    productId: config.pageContext?.productId || getProductId(),
    pageType: config.pageContext?.pageType || document.querySelector('[data-page-type]')?.getAttribute('data-page-type') || undefined,
  };

  // If category ID is not found and this is likely a category page, fetch async
  const pageContext = initialPageContext;

  // Create React root and render the product table
  const root = createRoot(container);

  // If category ID not found but we're in current-category mode, try async resolution
  if (config.productSource === 'current-category' && !pageContext.categoryId) {
    // Show loading state initially
    root.render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ProductTable config={config} pageContext={pageContext} />
        </QueryClientProvider>
      </ErrorBoundary>
    );

    // Resolve category ID asynchronously
    getCategoryIdAsync().then((categoryId) => {
      if (categoryId) {
        // Re-render with resolved category ID
        const updatedPageContext = { ...pageContext, categoryId };
        root.render(
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ProductTable config={config} pageContext={updatedPageContext} />
            </QueryClientProvider>
          </ErrorBoundary>
        );
      }
    });
  } else {
    // Render immediately with available data
    root.render(
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ProductTable config={config} pageContext={pageContext} />
        </QueryClientProvider>
      </ErrorBoundary>
    );
  }

  // Store cleanup function
  (window as any).__productTableWidgets = (window as any).__productTableWidgets || {};
  (window as any).__productTableWidgets[config.productTableId] = () => {
    root.unmount();
  };

  return root;
};

/**
 * Auto-initialize product tables from data attributes
 */
export const autoInitWidgets = async () => {
  const productTables = document.querySelectorAll('[data-product-table-widget]');

  for (let index = 0; index < productTables.length; index++) {
    const element = productTables[index];
    try {
      // Get productTableId from data attribute (just the ID, not full config)
      const productTableId = element.getAttribute('data-product-table-widget') ||
        element.getAttribute('data-product-table-id');

      if (!productTableId) {
        continue;
      }

      // Fetch product table configuration from API using query parameter
      const baseUrl = (window as any).__GADGET_API_URL__ || '';
      const configUrl = `${baseUrl}/api/product-tables?productTableId=${productTableId}`;

      const response = await fetch(configUrl);

      if (!response.ok) {
        continue;
      }

      const { success, productTable: config } = await response.json();

      if (!success || !config) {
        continue;
      }

      initProductTableWidget({
        ...config,
        containerId: element.id || undefined,
      });
    } catch (error) {
      // Silently fail
    }
  }
};

/**
 * Cleanup all product tables
 */
export const cleanupAllWidgets = () => {
  const productTables = (window as any).__productTableWidgets || {};
  Object.values(productTables).forEach((cleanup: any) => {
    if (typeof cleanup === 'function') {
      cleanup();
    }
  });
  (window as any).__productTableWidgets = {};
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInitWidgets);
} else {
  autoInitWidgets();
}

// Expose to window for manual initialization
(window as any).ProductTableWidget = {
  init: initProductTableWidget,
  autoInit: autoInitWidgets,
  cleanup: cleanupAllWidgets,
};
