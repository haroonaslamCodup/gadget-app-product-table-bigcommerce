import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { ProductFilters, ProductsResponse } from "../types";

/**
 * Hook to fetch products with filters
 */
export const useProducts = (filters: ProductFilters): UseQueryResult<ProductsResponse, Error> => {
  const { category, collection, userGroup, search, page = 1, limit = 25, sort = "name" } = filters;

  return useQuery<ProductsResponse, Error>({
    queryKey: ["products", filters],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (category) params.set("category", category);
      if (collection) params.set("collection", collection);
      if (userGroup) params.set("userGroup", userGroup);
      if (search) params.set("search", search);
      params.set("page", page.toString());
      params.set("limit", limit.toString());
      params.set("sort", sort);

      const response = await fetch(`/api/products?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      return response.json();
    },
    enabled: !!(category || collection || search || page),
    staleTime: 1000 * 60 * 5, // 5 minutes
    placeholderData: (previousData) => previousData, // Keep previous data while loading
  });
};

import type { PricingInfo, Collection, ApiResponse } from "../types";

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

      const response = await fetch(`/api/pricing?${params.toString()}`);

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
 * Hook to fetch available collections
 */
export const useCollections = (search?: string): UseQueryResult<Collection[], Error> => {
  return useQuery<Collection[], Error>({
    queryKey: ["collections", search],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (search) params.set("search", search);

      const response = await fetch(`/api/collections?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch collections");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - collections don't change often
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

      const response = await fetch(`/api/version-check?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to check version");
      }

      return response.json();
    },
    enabled: !!(widgetId && currentVersion),
    staleTime: 1000 * 60 * 60, // 1 hour
  });
};
