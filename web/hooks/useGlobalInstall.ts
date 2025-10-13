import { useMutation, useQueryClient } from "@tanstack/react-query";

interface GlobalInstallParams {
  productTableId: string;
}

export const useGlobalInstallWidget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productTableId }: GlobalInstallParams) => {
      const baseUrl = (window as any).__GADGET_API_URL__ || window.location.origin;
      const response = await fetch(`${baseUrl}/api/install-category-widget`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productTableId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to install widget globally");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate relevant queries if needed
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
};
