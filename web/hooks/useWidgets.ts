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
      
      // Transform GadgetRecord to WidgetInstance
      return result.map((record: any) => {
        const widget: WidgetInstance = {
          id: record.id,
          createdAt: record.createdAt.toISOString(),
          updatedAt: record.updatedAt.toISOString(),
          widgetId: record.widgetId || '',
          widgetName: record.widgetName || undefined,
          displayFormat: record.displayFormat as any,
          columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
          columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
          productSource: record.productSource as any,
          selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
          selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
          targetAllCustomers: record.targetAllCustomers ?? true,
          targetRetailOnly: record.targetRetailOnly ?? false,
          targetWholesaleOnly: record.targetWholesaleOnly ?? false,
          targetLoggedInOnly: record.targetLoggedInOnly ?? false,
          targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
          allowViewSwitching: record.allowViewSwitching ?? true,
          defaultToTableView: record.defaultToTableView ?? false,
          enableCustomerSorting: record.enableCustomerSorting ?? true,
          defaultSort: record.defaultSort as any,
          itemsPerPage: record.itemsPerPage ?? 25,
          isActive: record.isActive ?? true,
          placementLocation: record.placementLocation as any,
          version: record.version || '1.0.0',
          notes: record.notes || '',
          createdBy: record.createdBy || undefined,
          lastChecked: record.lastChecked || undefined,
          pageBuilderId: record.pageBuilderId || undefined,
          pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
        };
        return widget;
      });
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

      if (!result) return null;

      const record = result as any;
      const widget: WidgetInstance = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        widgetId: record.widgetId || '',
        widgetName: record.widgetName || undefined,
        displayFormat: record.displayFormat as any,
        columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
        columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
        productSource: record.productSource as any,
        selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
        selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
        targetAllCustomers: record.targetAllCustomers ?? true,
        targetRetailOnly: record.targetRetailOnly ?? false,
        targetWholesaleOnly: record.targetWholesaleOnly ?? false,
        targetLoggedInOnly: record.targetLoggedInOnly ?? false,
        targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
        allowViewSwitching: record.allowViewSwitching ?? true,
        defaultToTableView: record.defaultToTableView ?? false,
        enableCustomerSorting: record.enableCustomerSorting ?? true,
        defaultSort: record.defaultSort as any,
        itemsPerPage: record.itemsPerPage ?? 25,
        isActive: record.isActive ?? true,
        placementLocation: record.placementLocation as any,
        version: record.version || '1.0.0',
        notes: record.notes || '',
        createdBy: record.createdBy || undefined,
        lastChecked: record.lastChecked || undefined,
        pageBuilderId: record.pageBuilderId || undefined,
        pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
      };
      return widget;
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

      if (!result) return null;

      const record = result as any;
      const widget: WidgetInstance = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        widgetId: record.widgetId || '',
        widgetName: record.widgetName || undefined,
        displayFormat: record.displayFormat as any,
        columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
        columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
        productSource: record.productSource as any,
        selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
        selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
        targetAllCustomers: record.targetAllCustomers ?? true,
        targetRetailOnly: record.targetRetailOnly ?? false,
        targetWholesaleOnly: record.targetWholesaleOnly ?? false,
        targetLoggedInOnly: record.targetLoggedInOnly ?? false,
        targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
        allowViewSwitching: record.allowViewSwitching ?? true,
        defaultToTableView: record.defaultToTableView ?? false,
        enableCustomerSorting: record.enableCustomerSorting ?? true,
        defaultSort: record.defaultSort as any,
        itemsPerPage: record.itemsPerPage ?? 25,
        isActive: record.isActive ?? true,
        placementLocation: record.placementLocation as any,
        version: record.version || '1.0.0',
        notes: record.notes || '',
        createdBy: record.createdBy || undefined,
        lastChecked: record.lastChecked || undefined,
        pageBuilderId: record.pageBuilderId || undefined,
        pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
      };
      return widget;
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

      const record = result as any;
      const widget: WidgetInstance = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        widgetId: record.widgetId || '',
        widgetName: record.widgetName || undefined,
        displayFormat: record.displayFormat as any,
        columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
        columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
        productSource: record.productSource as any,
        selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
        selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
        targetAllCustomers: record.targetAllCustomers ?? true,
        targetRetailOnly: record.targetRetailOnly ?? false,
        targetWholesaleOnly: record.targetWholesaleOnly ?? false,
        targetLoggedInOnly: record.targetLoggedInOnly ?? false,
        targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
        allowViewSwitching: record.allowViewSwitching ?? true,
        defaultToTableView: record.defaultToTableView ?? false,
        enableCustomerSorting: record.enableCustomerSorting ?? true,
        defaultSort: record.defaultSort as any,
        itemsPerPage: record.itemsPerPage ?? 25,
        isActive: record.isActive ?? true,
        placementLocation: record.placementLocation as any,
        version: record.version || '1.0.0',
        notes: record.notes || '',
        createdBy: record.createdBy || undefined,
        lastChecked: record.lastChecked || undefined,
        pageBuilderId: record.pageBuilderId || undefined,
        pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
      };
      return widget;
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

      const record = result as any;
      const widget: WidgetInstance = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        widgetId: record.widgetId || '',
        widgetName: record.widgetName || undefined,
        displayFormat: record.displayFormat as any,
        columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
        columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
        productSource: record.productSource as any,
        selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
        selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
        targetAllCustomers: record.targetAllCustomers ?? true,
        targetRetailOnly: record.targetRetailOnly ?? false,
        targetWholesaleOnly: record.targetWholesaleOnly ?? false,
        targetLoggedInOnly: record.targetLoggedInOnly ?? false,
        targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
        allowViewSwitching: record.allowViewSwitching ?? true,
        defaultToTableView: record.defaultToTableView ?? false,
        enableCustomerSorting: record.enableCustomerSorting ?? true,
        defaultSort: record.defaultSort as any,
        itemsPerPage: record.itemsPerPage ?? 25,
        isActive: record.isActive ?? true,
        placementLocation: record.placementLocation as any,
        version: record.version || '1.0.0',
        notes: record.notes || '',
        createdBy: record.createdBy || undefined,
        lastChecked: record.lastChecked || undefined,
        pageBuilderId: record.pageBuilderId || undefined,
        pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
      };
      return widget;
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
      const ctx = context as { previousWidget?: WidgetInstance } | undefined;
      if (ctx?.previousWidget) {
        queryClient.setQueryData(["widget", variables.id], ctx.previousWidget);
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
export const useDeleteWidget = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await api.widgetInstance.delete(id);
    },
    onSuccess: (_data, deletedId) => {
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
export const useDuplicateWidget = (storeId?: string): UseMutationResult<WidgetInstance, Error, WidgetInstance> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, WidgetInstance>({
    mutationFn: async (sourceWidget: WidgetInstance) => {
      // Extract only the writable fields (exclude id, createdAt, updatedAt, widgetId)
      const newConfig: any = {
        widgetName: `${sourceWidget.widgetName} (Copy)`,
        displayFormat: sourceWidget.displayFormat,
        columns: sourceWidget.columns,
        columnsOrder: sourceWidget.columnsOrder,
        productSource: sourceWidget.productSource,
        selectedCollections: sourceWidget.selectedCollections,
        selectedCategories: sourceWidget.selectedCategories,
        targetAllCustomers: sourceWidget.targetAllCustomers,
        targetRetailOnly: sourceWidget.targetRetailOnly,
        targetWholesaleOnly: sourceWidget.targetWholesaleOnly,
        targetLoggedInOnly: sourceWidget.targetLoggedInOnly,
        targetCustomerTags: sourceWidget.targetCustomerTags,
        allowViewSwitching: sourceWidget.allowViewSwitching,
        defaultToTableView: sourceWidget.defaultToTableView,
        enableCustomerSorting: sourceWidget.enableCustomerSorting,
        defaultSort: sourceWidget.defaultSort,
        itemsPerPage: sourceWidget.itemsPerPage,
        placementLocation: sourceWidget.placementLocation,
        isActive: sourceWidget.isActive,
        notes: sourceWidget.notes,
        version: sourceWidget.version,
        store: {
          _link: storeId
        }
      };

      const result = await api.widgetInstance.create(newConfig);

      const record = result as any;
      const widget: WidgetInstance = {
        id: record.id,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        widgetId: record.widgetId || '',
        widgetName: record.widgetName || undefined,
        displayFormat: record.displayFormat as any,
        columns: record.columns ? JSON.parse(JSON.stringify(record.columns)) : undefined,
        columnsOrder: record.columnsOrder ? JSON.parse(JSON.stringify(record.columnsOrder)) : undefined,
        productSource: record.productSource as any,
        selectedCollections: record.selectedCollections ? JSON.parse(JSON.stringify(record.selectedCollections)) : undefined,
        selectedCategories: record.selectedCategories ? JSON.parse(JSON.stringify(record.selectedCategories)) : undefined,
        targetAllCustomers: record.targetAllCustomers ?? true,
        targetRetailOnly: record.targetRetailOnly ?? false,
        targetWholesaleOnly: record.targetWholesaleOnly ?? false,
        targetLoggedInOnly: record.targetLoggedInOnly ?? false,
        targetCustomerTags: record.targetCustomerTags ? JSON.parse(JSON.stringify(record.targetCustomerTags)) : [],
        allowViewSwitching: record.allowViewSwitching ?? true,
        defaultToTableView: record.defaultToTableView ?? false,
        enableCustomerSorting: record.enableCustomerSorting ?? true,
        defaultSort: record.defaultSort as any,
        itemsPerPage: record.itemsPerPage ?? 25,
        isActive: record.isActive ?? true,
        placementLocation: record.placementLocation as any,
        version: record.version || '1.0.0',
        notes: record.notes || '',
        createdBy: record.createdBy || undefined,
        lastChecked: record.lastChecked || undefined,
        pageBuilderId: record.pageBuilderId || undefined,
        pageContext: record.pageContext ? JSON.parse(JSON.stringify(record.pageContext)) : undefined,
      };
      return widget;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["widgets"] });
    },
  });
};
