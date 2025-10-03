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
    console.log('[Product Table Loader] Found Gadget app URL:', url.origin);
    return url.origin;
  }

  // Fallback: try to detect from current script during initial execution
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript?.src) {
    const url = new URL(currentScript.src);
    console.log('[Product Table Loader] Using currentScript URL:', url.origin);
    return url.origin;
  }

  // Last resort: use window location (this will fail on storefront)
  console.warn('[Product Table Loader] Could not detect Gadget app URL, using window.location.origin');
  return window.location.origin;
};

const gadgetAppUrl = getGadgetAppUrl();

// Store API base URL globally so hooks can access it
(window as any).__GADGET_API_URL__ = gadgetAppUrl;
console.log('[Product Table Loader] Set global __GADGET_API_URL__ to:', gadgetAppUrl);

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
  console.log('[initProductTableWidget] Initializing with config:', config);
  const containerId = config.containerId || `product-table-${config.productTableId}`;
  console.log('[initProductTableWidget] Looking for container:', containerId);
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`[initProductTableWidget] Container #${containerId} not found`);
    console.log('[initProductTableWidget] Available element IDs:',
      Array.from(document.querySelectorAll('[id]')).map(el => el.id).filter(id => id.includes('product')).slice(0, 10)
    );
    return;
  }

  console.log('[initProductTableWidget] Found container:', container);

  // Get page context from the DOM
  const pageContext = {
    categoryId: document.querySelector('[data-category-id]')?.getAttribute('data-category-id') || undefined,
    productId: document.querySelector('[data-product-id]')?.getAttribute('data-product-id') || undefined,
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
  console.log('[Product Table Loader] Auto-initializing product tables...');
  const productTables = document.querySelectorAll('[data-product-table-widget]');
  console.log('[Product Table Loader] Found', productTables.length, 'product table elements');

  for (let index = 0; index < productTables.length; index++) {
    const element = productTables[index];
    try {
      console.log(`[Product Table Loader] Initializing product table ${index + 1}/${productTables.length}`);

      // Get productTableId from data attribute (just the ID, not full config)
      const productTableId = element.getAttribute('data-product-table-widget') ||
                       element.getAttribute('data-product-table-id');

      console.log('[Product Table Loader] Product Table ID:', productTableId);

      if (!productTableId) {
        console.warn('[Product Table Loader] No product table ID found for element:', element);
        continue;
      }

      // Fetch product table configuration from API using query parameter
      const baseUrl = (window as any).__GADGET_API_URL__ || '';
      const configUrl = `${baseUrl}/api/product-tables?productTableId=${productTableId}`;

      console.log('[Product Table Loader] Fetching config from:', configUrl);

      const response = await fetch(configUrl);

      if (!response.ok) {
        console.error('[Product Table Loader] Failed to fetch product table config:', response.status, response.statusText);
        continue;
      }

      const { success, productTable: config, error } = await response.json();

      if (!success || !config) {
        console.error('[Product Table Loader] Product table config fetch failed:', error);
        continue;
      }

      console.log('[Product Table Loader] Fetched config:', config);

      initProductTableWidget({
        ...config,
        containerId: element.id || undefined,
      });

      console.log(`[Product Table Loader] Product table ${productTableId} initialized successfully`);
    } catch (error) {
      console.error('[Product Table Loader] Failed to initialize product table:', error, 'Element:', element);
    }
  }

  console.log('[Product Table Loader] Auto-initialization complete');
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
