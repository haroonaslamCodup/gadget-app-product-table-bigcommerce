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

// Get the Gadget app URL from the script tag
// Look for the script tag that loaded widget-loader.js
const getGadgetAppUrl = () => {
  const scripts = document.querySelectorAll('script[src*="widget-loader.js"]');
  if (scripts.length > 0) {
    const scriptSrc = (scripts[0] as HTMLScriptElement).src;
    const url = new URL(scriptSrc);
    console.log('[Widget Loader] Found Gadget app URL:', url.origin);
    return url.origin;
  }

  // Fallback: try to detect from current script during initial execution
  const currentScript = document.currentScript as HTMLScriptElement;
  if (currentScript?.src) {
    const url = new URL(currentScript.src);
    console.log('[Widget Loader] Using currentScript URL:', url.origin);
    return url.origin;
  }

  // Last resort: use window location (this will fail on storefront)
  console.warn('[Widget Loader] Could not detect Gadget app URL, using window.location.origin');
  return window.location.origin;
};

const gadgetAppUrl = getGadgetAppUrl();

// Store API base URL globally so hooks can access it
(window as any).__GADGET_API_URL__ = gadgetAppUrl;
console.log('[Widget Loader] Set global __GADGET_API_URL__ to:', gadgetAppUrl);

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
  console.log('[initProductTableWidget] Initializing with config:', config);
  const containerId = config.containerId || `product-table-${config.widgetId}`;
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
export const autoInitWidgets = async () => {
  console.log('[Widget Loader] Auto-initializing widgets...');
  const widgets = document.querySelectorAll('[data-product-table-widget]');
  console.log('[Widget Loader] Found', widgets.length, 'widget elements');

  for (let index = 0; index < widgets.length; index++) {
    const element = widgets[index];
    try {
      console.log(`[Widget Loader] Initializing widget ${index + 1}/${widgets.length}`);

      // Get widgetId from data attribute (just the ID, not full config)
      const widgetId = element.getAttribute('data-product-table-widget') ||
                       element.getAttribute('data-widget-id');

      console.log('[Widget Loader] Widget ID:', widgetId);

      if (!widgetId) {
        console.warn('[Widget Loader] No widget ID found for element:', element);
        continue;
      }

      // Fetch widget configuration from API
      const baseUrl = (window as any).__GADGET_API_URL__ || '';
      const configUrl = `${baseUrl}/api/widgets/${widgetId}`;

      console.log('[Widget Loader] Fetching config from:', configUrl);

      const response = await fetch(configUrl);

      if (!response.ok) {
        console.error('[Widget Loader] Failed to fetch widget config:', response.status, response.statusText);
        continue;
      }

      const { success, widget: config, error } = await response.json();

      if (!success || !config) {
        console.error('[Widget Loader] Widget config fetch failed:', error);
        continue;
      }

      console.log('[Widget Loader] Fetched config:', config);

      initProductTableWidget({
        ...config,
        containerId: element.id || undefined,
      });

      console.log(`[Widget Loader] Widget ${widgetId} initialized successfully`);
    } catch (error) {
      console.error('[Widget Loader] Failed to initialize product table widget:', error, 'Element:', element);
    }
  }

  console.log('[Widget Loader] Auto-initialization complete');
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
