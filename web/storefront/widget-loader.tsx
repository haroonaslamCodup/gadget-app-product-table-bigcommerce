/**
 * BigCommerce Page Builder Widget Loader
 *
 * This script initializes product table widgets on the storefront.
 * It should be loaded via BigCommerce Page Builder widget configuration.
 */

import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ProductTable } from "../components/storefront/ProductTable";
import { ErrorBoundary } from "../components/ErrorBoundary";

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

interface WidgetConfig {
  widgetId: string;
  containerId?: string;
  // All other widget configuration fields
  [key: string]: any;
}

/**
 * Initialize a product table widget
 */
export const initProductTableWidget = (config: WidgetConfig) => {
  const containerId = config.containerId || `product-table-${config.widgetId}`;
  const container = document.getElementById(containerId);

  if (!container) {
    console.error(`Product Table Widget: Container #${containerId} not found`);
    return;
  }

  // Get page context from the DOM
  const pageContext = {
    categoryId: document.querySelector('[data-category-id]')?.getAttribute('data-category-id') || undefined,
    productId: document.querySelector('[data-product-id]')?.getAttribute('data-product-id') || undefined,
    pageType: document.querySelector('[data-page-type]')?.getAttribute('data-page-type') || undefined,
  };

  // Create React root and render the widget
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
  (window as any).__productTableWidgets[config.widgetId] = () => {
    root.unmount();
  };

  return root;
};

/**
 * Auto-initialize widgets from data attributes
 */
export const autoInitWidgets = () => {
  const widgets = document.querySelectorAll('[data-product-table-widget]');

  widgets.forEach((element) => {
    try {
      const configData = element.getAttribute('data-product-table-widget');
      if (configData) {
        const config = JSON.parse(configData);
        initProductTableWidget({
          ...config,
          containerId: element.id || undefined,
        });
      }
    } catch (error) {
      console.error('Failed to initialize product table widget:', error);
    }
  });
};

/**
 * Cleanup all widgets
 */
export const cleanupAllWidgets = () => {
  const widgets = (window as any).__productTableWidgets || {};
  Object.values(widgets).forEach((cleanup: any) => {
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
