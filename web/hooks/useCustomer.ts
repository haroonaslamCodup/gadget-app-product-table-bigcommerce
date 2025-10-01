import { useQuery } from "@tanstack/react-query";

export interface CustomerContext {
  customerId: string | null;
  customerGroup: string;
  customerGroupId: number | null;
  customerTags: string[];
  isLoggedIn: boolean;
  isWholesale: boolean;
  email: string | null;
  name: string | null;
}

/**
 * Hook to fetch customer context
 * Determines customer group, tags, logged-in status for pricing and visibility
 */
export const useCustomerContext = (customerId?: string) => {
  return useQuery<CustomerContext>({
    queryKey: ["customer-context", customerId],
    queryFn: async () => {
      const params = new URLSearchParams();

      if (customerId) params.set("customerId", customerId);

      const response = await fetch(`/api/customer-context?${params.toString()}`);

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
export const useBigCommerceContext = () => {
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
