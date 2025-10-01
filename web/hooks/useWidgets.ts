import { useQuery, useMutation, useQueryClient, UseQueryResult, UseMutationResult } from "@tanstack/react-query";
import { api } from "../api";
import type { WidgetInstance, WidgetFormData } from "../types";

/**
 * Hook to fetch all widgets for a specific store
 */
export const useWidgets = (storeId?: string): UseQueryResult<WidgetInstance[], Error> => {
  return useQuery<WidgetInstance[], Error>({
    queryKey: ["widgets", storeId],
    queryFn: async () => {
      const result = await api.widgetInstance.findMany({
        filter: storeId ? { store: { id: { equals: storeId } } } : undefined,
        sort: { createdAt: "Descending" }
      });
      return result as unknown as WidgetInstance[];
    },
    enabled: !!storeId,
  });
};

/**
 * Hook to fetch a single widget by ID
 */
export const useWidget = (widgetId?: string): UseQueryResult<WidgetInstance | null, Error> => {
  return useQuery<WidgetInstance | null, Error>({
    queryKey: ["widget", widgetId],
    queryFn: async () => {
      if (!widgetId) return null;

      const result = await api.widgetInstance.findFirst({
        filter: { widgetId: { equals: widgetId } }
      });
      return result as unknown as WidgetInstance | null;
    },
    enabled: !!widgetId,
  });
};

/**
 * Hook to fetch a widget by database ID
 */
export const useWidgetById = (id?: string): UseQueryResult<WidgetInstance | null, Error> => {
  return useQuery<WidgetInstance | null, Error>({
    queryKey: ["widget", "id", id],
    queryFn: async () => {
      if (!id) return null;
      const result = await api.widgetInstance.findOne(id);
      return result as unknown as WidgetInstance | null;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new widget
 */
export const useCreateWidget = (): UseMutationResult<WidgetInstance, Error, Partial<WidgetFormData>> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, Partial<WidgetFormData>>({
    mutationFn: async (config: Partial<WidgetFormData>) => {
      const result = await api.widgetInstance.create(config);
      return result as unknown as WidgetInstance;
    },
    onSuccess: (data: WidgetInstance) => {
      // Invalidate and refetch widgets list
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      // Set the newly created widget in cache
      if (data?.widgetId) {
        queryClient.setQueryData(["widget", data.widgetId], data);
      }
    },
  });
};

/**
 * Hook to update an existing widget
 */
export const useUpdateWidget = (): UseMutationResult<
  WidgetInstance,
  Error,
  { id: string; config: Partial<WidgetFormData> }
> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, { id: string; config: Partial<WidgetFormData> }>({
    mutationFn: async ({ id, config }: { id: string; config: Partial<WidgetFormData> }) => {
      const result = await api.widgetInstance.update(id, config);
      return result as unknown as WidgetInstance;
    },
    onMutate: async ({ id, config }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["widget", id] });

      // Snapshot previous value
      const previousWidget = queryClient.getQueryData<WidgetInstance>(["widget", id]);

      // Optimistically update to the new value
      queryClient.setQueryData<WidgetInstance>(["widget", id], (old) => ({
        ...old!,
        ...config,
      }));

      // Return context with the snapshot
      return { previousWidget };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      if (context?.previousWidget) {
        queryClient.setQueryData(["widget", variables.id], context.previousWidget);
      }
    },
    onSuccess: (data, _variables) => {
      // Invalidate widgets list
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      // Update the specific widget cache
      if (data?.widgetId) {
        queryClient.setQueryData(["widget", data.widgetId], data);
      }
    },
  });
};

/**
 * Hook to delete a widget
 */
export const useDeleteWidget = (): UseMutationResult<string, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation<string, Error, string>({
    mutationFn: async (id: string) => {
      await api.widgetInstance.delete(id);
      return id;
    },
    onSuccess: (deletedId: string) => {
      // Invalidate widgets list
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
      // Remove the deleted widget from cache
      queryClient.removeQueries({ queryKey: ["widget", deletedId] });
    },
  });
};

/**
 * Hook to duplicate a widget
 */
export const useDuplicateWidget = (): UseMutationResult<WidgetInstance, Error, WidgetInstance> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, WidgetInstance>({
    mutationFn: async (sourceWidget: WidgetInstance) => {
      const newConfig: Partial<WidgetFormData> = {
        ...sourceWidget,
        widgetName: `${sourceWidget.widgetName} (Copy)`,
      };

      const result = await api.widgetInstance.create(newConfig);
      return result as unknown as WidgetInstance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
};
