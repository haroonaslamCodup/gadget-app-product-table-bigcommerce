import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { ProductFilters, ProductsResponse } from "../types";

// Get API base URL - use Gadget app URL on storefront, local URL in admin
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__GADGET_API_URL__) {
    const url = (window as any).__GADGET_API_URL__;
    return url;
  }
  return ''; // Use relative URLs in admin
};

/**
 * Hook to fetch products with filters
 */
export const useProducts = (filters: ProductFilters): UseQueryResult<ProductsResponse, Error> => {
  const { category, userGroup, search, page = 1, limit = 25, sort = "name" } = filters;

  return useQuery<ProductsResponse, Error>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (category) params.set("category", category);
      if (userGroup) params.set("userGroup", userGroup);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("sort", sort);

      const baseUrl = getApiBaseUrl();
      const url = `${baseUrl}/api/products?${params.toString()}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data = await response.json();

      // Keep variants nested within products for hierarchical display
      return data;
    },
    enabled: true, // Always enabled - fetch all products if no filters
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

import type { PricingInfo, ApiResponse } from "../types";

/**
 * Hook to fetch pricing for a specific product
 */
export const useProductPricing = (productId?: string, variantId?: string, userGroup?: string): UseQueryResult<PricingInfo | null, Error> => {
  return useQuery<PricingInfo | null, Error>({
    queryKey: ["pricing", productId, variantId, userGroup],
    queryFn: async () => {
      if (!productId) return null;

      const params = new URLSearchParams({
        productId,
      });

      if (variantId) params.set("variantId", variantId);
      if (userGroup) params.set("userGroup", userGroup);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/pricing?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch pricing");
      }

      return response.json();
    },
    enabled: !!productId,
    staleTime: 1000 * 60 * 2, // 2 minutes - pricing may change more frequently
  });
};

/**
 * Hook to check for widget version updates
 */
export const useVersionCheck = (widgetId?: string, currentVersion?: string): UseQueryResult<ApiResponse<any> | null, Error> => {
  return useQuery<ApiResponse<any> | null, Error>({
    queryKey: ["version-check", widgetId, currentVersion],
    queryFn: async () => {
      if (!widgetId || !currentVersion) return null;

      const params = new URLSearchParams({
        widgetId,
        currentVersion,
      });

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/version-check?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to check version");
      }

      return response.json();
    },
    enabled: !!(widgetId && currentVersion),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
