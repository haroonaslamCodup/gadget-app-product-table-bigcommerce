/**
 * BigCommerce Page Builder Product Table Loader
 *
 * This script initializes product tables on the storefront.
 * It should be loaded via BigCommerce Page Builder configuration.
 */

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductTable } from "../components/storefront/ProductTable";
import { ErrorBoundary } from "../components/ErrorBoundary";

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
      console.log('[Product Table] ✓ Category ID from data-category-id:', dataAttr);
      return dataAttr;
    }

    // Try window.BCData (most reliable for BigCommerce - when available)
    if (typeof window !== 'undefined' && (window as any).BCData?.category_id) {
      const categoryId = String((window as any).BCData.category_id);
      console.log('[Product Table] ✓ Category ID from BCData:', categoryId);
      return categoryId;
    }

    // Try body element data attribute
    const bodyDataCategoryId = document.body.getAttribute('data-category-id');
    if (bodyDataCategoryId) {
      console.log('[Product Table] ✓ Category ID from body[data-category-id]:', bodyDataCategoryId);
      return bodyDataCategoryId;
    }

    // Try page body class with various formats (some themes)
    const bodyClasses = document.body.className;

    // Format: categoryId--123
    const categoryMatch1 = bodyClasses.match(/categoryId--(\d+)/);
    if (categoryMatch1 && categoryMatch1[1]) {
      console.log('[Product Table] ✓ Category ID from body class (format 1):', categoryMatch1[1]);
      return categoryMatch1[1];
    }

    // Format: category-123 or cat-123
    const categoryMatch2 = bodyClasses.match(/(?:category|cat)-(\d+)/);
    if (categoryMatch2 && categoryMatch2[1]) {
      console.log('[Product Table] ✓ Category ID from body class (format 2):', categoryMatch2[1]);
      return categoryMatch2[1];
    }

    // Try meta tag
    const metaCategory = document.querySelector('meta[name="category-id"]') ||
                         document.querySelector('meta[property="category:id"]');
    if (metaCategory) {
      const categoryId = metaCategory.getAttribute('content');
      if (categoryId) {
        console.log('[Product Table] ✓ Category ID from meta tag:', categoryId);
        return categoryId;
      }
    }

    // Try finding category link in breadcrumbs
    const breadcrumbLink = document.querySelector('a[href*="/garden/"], a[href*="/category/"]');
    if (breadcrumbLink) {
      const href = breadcrumbLink.getAttribute('href') || '';
      const urlCategoryMatch = href.match(/\/(?:garden|category)\/([^\/]+)/);
      if (urlCategoryMatch) {
        console.log('[Product Table] ⚠️ Found category in breadcrumb, but cannot get numeric ID. URL slug:', urlCategoryMatch[1]);
      }
    }

    // Last resort: Check if we're on a category-like page based on URL patterns
    const pathname = window.location.pathname;
    const isLikelyCategoryPage = /^\/(garden|shop|category|products|collection)\//.test(pathname);

    if (isLikelyCategoryPage) {
      console.warn('[Product Table] ❌ Category page detected by URL pattern, but no category ID found.');
      console.warn('[Product Table] URL:', pathname);
      console.warn('[Product Table] This theme does not inject category_id. Manual fix required.');
    } else {
      console.log('[Product Table] ℹ️ Not on a category page. URL:', pathname);
    }

    console.warn('[Product Table] Category auto-detection failed. BCData:', (window as any).BCData);
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
          console.log('[Product Table] ✓ Category ID from localStorage cache:', categoryId);
          return categoryId;
        }
      }
    } catch (e) {
      // localStorage might be disabled or full
    }

    try {
      console.log('[Product Table] 🔄 Attempting API category resolution for URL:', pathname);

      const baseUrl = (window as any).__GADGET_API_URL__ || window.location.origin;
      const apiUrl = `${baseUrl}/api/resolve-category?url=${encodeURIComponent(pathname)}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        console.warn('[Product Table] API category resolution failed:', response.status);
        return undefined;
      }

      const data = await response.json();

      if (data.success && data.categoryId) {
        console.log('[Product Table] ✓ Category ID resolved from API:', data.categoryId, `(${data.categoryName})`);

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
      console.warn('[Product Table] Error resolving category from API:', error);
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

  // Debug logging for page context detection
  if (config.showVariantsOnPDP || config.productSource === 'current-product-variants') {
    console.log('[Product Table Widget] Config:', config);
    console.log('[Product Table Widget] Page Context:', pageContext);
    console.log('[Product Table Widget] BCData:', (window as any).BCData);
    console.log('[Product Table Widget] Available sources:', {
      dataAttribute: document.querySelector('[data-entity-id]')?.getAttribute('data-entity-id'),
      bcData: (window as any).BCData?.product_id,
      metaTag: document.querySelector('meta[property="product:id"]')?.getAttribute('content'),
      configOverride: config.pageContext?.productId
    });
  }

  // Debug logging for current-category mode
  if (config.productSource === 'current-category') {
    console.log('[Product Table] 🔍 Current Category Mode Enabled');
    console.log('[Product Table] Product Source:', config.productSource);
    console.log('[Product Table] Detected Category ID:', pageContext.categoryId);
    console.log('[Product Table] Full Page Context:', pageContext);
    console.log('[Product Table] BCData Available:', (window as any).BCData);
    console.log('[Product Table] Body Classes:', document.body.className);

    if (!pageContext.categoryId) {
      console.error('[Product Table] ❌ Category ID not detected! Widget may show all products.');
      console.log('[Product Table] 💡 Troubleshooting tips:');
      console.log('  1. Check if window.BCData.category_id exists on this page');
      console.log('  2. Verify you are on a category page');
      console.log('  3. Check if your theme injects BCData properly');
    } else {
      console.log('[Product Table] ✅ Category detected successfully!');
    }
  }

  // Create React root and render the product table
  const root = createRoot(container);

  // If category ID not found but we're in current-category mode, try async resolution
  if (config.productSource === 'current-category' && !pageContext.categoryId) {
    console.log('[Product Table] 🔄 Category ID not available, attempting async resolution...');

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
        console.log('[Product Table] ✅ Async category resolution successful, re-rendering with category:', categoryId);
        // Re-render with resolved category ID
        const updatedPageContext = { ...pageContext, categoryId };
        root.render(
          <ErrorBoundary>
            <QueryClientProvider client={queryClient}>
              <ProductTable config={config} pageContext={updatedPageContext} />
            </QueryClientProvider>
          </ErrorBoundary>
        );
      } else {
        console.warn('[Product Table] ⚠️ Async category resolution failed, widget will show all products');
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
