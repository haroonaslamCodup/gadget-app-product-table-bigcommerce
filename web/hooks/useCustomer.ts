import { useQuery, UseQueryResult } from "@tanstack/react-query";
import type { CustomerContext } from "../types";

// Get API base URL - use Gadget app URL on storefront, local URL in admin
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined' && (window as any).__GADGET_API_URL__) {
    return (window as any).__GADGET_API_URL__;
  }
  return ''; // Use relative URLs in admin
};

/**
 * Hook to fetch customer context
 * Determines customer group, tags, logged-in status for pricing and visibility
 */
export const useCustomerContext = (customerId?: string): UseQueryResult<CustomerContext, Error> => {
  return useQuery<CustomerContext, Error>({
    queryKey: ["customer-context", customerId],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (customerId) params.set("customerId", customerId);

      const baseUrl = getApiBaseUrl();
      const response = await fetch(`${baseUrl}/api/customer-context?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Failed to fetch customer context");
      }

      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
};

/**
 * Hook to get customer context from BigCommerce window object
 * This reads from window.BCData which is provided by BigCommerce storefront
 */
export const useBigCommerceContext = (): UseQueryResult<{
  customerId: string | null;
  isLoggedIn: boolean;
  cartId: string | null;
  storeHash: string | null;
  currency?: string;
}, Error> => {
  return useQuery({
    queryKey: ["bc-context"],
    queryFn: async () => {
      // Check if we're in BigCommerce storefront
      if (typeof window === "undefined" || !(window as any).BCData) {
        return {
          customerId: null,
          isLoggedIn: false,
          cartId: null,
          storeHash: null,
        };
      }

      const BCData = (window as any).BCData;

      return {
        customerId: BCData.customer_id || null,
        isLoggedIn: !!BCData.customer_id,
        cartId: BCData.cart_id || null,
        storeHash: BCData.store_hash || null,
        currency: BCData.currency || "USD",
      };
    },
    staleTime: Infinity, // BCData doesn't change during page load
    gcTime: Infinity,
  });
};
