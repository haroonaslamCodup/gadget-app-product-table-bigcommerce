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
    // Try data attribute first
    const dataAttr = document.querySelector('[data-product-id]')?.getAttribute('data-product-id');
    if (dataAttr) return dataAttr;

    // Try window.BCData (BigCommerce global)
    if (typeof window !== 'undefined' && (window as any).BCData?.product_id) {
      return String((window as any).BCData.product_id);
    }

    // Try meta tag
    const metaTag = document.querySelector('meta[property="product:id"]');
    if (metaTag) return metaTag.getAttribute('content') || undefined;

    return undefined;
  };

  const getCategoryId = () => {
    // Try data attribute first
    const dataAttr = document.querySelector('[data-category-id]')?.getAttribute('data-category-id');
    if (dataAttr) return dataAttr;

    // Try window.BCData
    if (typeof window !== 'undefined' && (window as any).BCData?.category_id) {
      return String((window as any).BCData.category_id);
    }

    return undefined;
  };

  const pageContext = {
    categoryId: getCategoryId(),
    productId: getProductId(),
    pageType: document.querySelector('[data-page-type]')?.getAttribute('data-page-type') || undefined,
  };

  // Create React root and render the product table
  const root = createRoot(container);

  root.render(
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ProductTable config={config} pageContext={pageContext} />
      </QueryClientProvider>
    </ErrorBoundary>
  );

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
