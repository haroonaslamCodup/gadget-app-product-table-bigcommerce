import { useMutation, UseMutationResult, useQuery, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { api } from "../api";
import type { WidgetFormData, WidgetInstance } from "../types";

// Helper function to safely convert dates to ISO strings
const safeToISOString = (date: any): string => {
  return date ? date.toISOString() : new Date().toISOString();
};

/**
 * Hook to fetch all product tables for a specific store
 */
export const useProductTables = (storeId?: string): UseQueryResult<WidgetInstance[], Error> => {
  return useQuery<WidgetInstance[], Error>({
    queryKey: ["productTables", storeId],
    queryFn: async () => {
      const result = await api.productTable.findMany({
        filter: storeId ? { store: { id: { equals: storeId } } } : undefined,
        sort: { createdAt: "Descending" }
      });

      // Transform GadgetRecord to WidgetInstance
      return result.map((record: any) => {
        const productTable: WidgetInstance = {
          id: record.id,
          createdAt: safeToISOString(record.createdAt),
          updatedAt: safeToISOString(record.updatedAt),
          productTableId: record.productTableId || '',
          productTableName: record.productTableName || undefined,
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
        return productTable;
      });
    },
    enabled: !!storeId,
  });
};

/**
 * Hook to fetch a single product table by ID
 */
export const useProductTable = (productTableId?: string): UseQueryResult<WidgetInstance | null, Error> => {
  return useQuery<WidgetInstance | null, Error>({
    queryKey: ["productTable", productTableId],
    queryFn: async () => {
      if (!productTableId) return null;

      const result = await api.productTable.findFirst({
        filter: { productTableId: { equals: productTableId } }
      });

      if (!result) return null;

      const record = result as any;
      const productTable: WidgetInstance = {
        id: record.id,
        createdAt: safeToISOString(record.createdAt),
        updatedAt: safeToISOString(record.updatedAt),
        productTableId: record.productTableId || '',
        productTableName: record.productTableName || undefined,
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
      return productTable;
    },
    enabled: !!productTableId,
  });
};

/**
 * Hook to fetch a product table by database ID
 */
export const useProductTableById = (id?: string): UseQueryResult<WidgetInstance | null, Error> => {
  return useQuery<WidgetInstance | null, Error>({
    queryKey: ["productTable", "id", id],
    queryFn: async () => {
      if (!id) return null;

      const result = await api.productTable.findOne(id);

      if (!result) return null;

      const record = result as any;
      const productTable: WidgetInstance = {
        id: record.id,
        createdAt: safeToISOString(record.createdAt),
        updatedAt: safeToISOString(record.updatedAt),
        productTableId: record.productTableId || '',
        productTableName: record.productTableName || undefined,
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
      return productTable;
    },
    enabled: !!id,
  });
};

/**
 * Hook to create a new product table
 */
export const useCreateProductTable = (): UseMutationResult<WidgetInstance, Error, Partial<WidgetFormData>> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, Partial<WidgetFormData>>({
    mutationFn: async (config: Partial<WidgetFormData>) => {
      const result = await api.productTable.create(config);

      const record = result as any;
      const productTable: WidgetInstance = {
        id: record.id,
        createdAt: safeToISOString(record.createdAt),
        updatedAt: safeToISOString(record.updatedAt),
        productTableId: record.productTableId || '',
        productTableName: record.productTableName || undefined,
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
      return productTable;
    },
    onSuccess: (data: WidgetInstance) => {
      // Invalidate and refetch product tables list
      queryClient.invalidateQueries({ queryKey: ["productTables"] });
      // Set the newly created product table in cache
      if (data?.productTableId) {
        queryClient.setQueryData(["productTable", data.productTableId], data);
      }
    },
  });
};

/**
 * Hook to update an existing product table
 */
export const useUpdateProductTable = (): UseMutationResult<
  WidgetInstance,
  Error,
  { id: string; config: Partial<WidgetFormData> }
> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, { id: string; config: Partial<WidgetFormData> }>({
    mutationFn: async ({ id, config }: { id: string; config: Partial<WidgetFormData> }) => {
      const result = await api.productTable.update(id, config);

      const record = result as any;
      const productTable: WidgetInstance = {
        id: record.id,
        createdAt: safeToISOString(record.createdAt),
        updatedAt: safeToISOString(record.updatedAt),
        productTableId: record.productTableId || '',
        productTableName: record.productTableName || undefined,
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
      return productTable;
    },
    onMutate: async ({ id, config }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["productTable", id] });

      // Snapshot previous value
      const previousProductTable = queryClient.getQueryData<WidgetInstance>(["productTable", id]);

      // Optimistically update to the new value
      queryClient.setQueryData<WidgetInstance>(["productTable", id], (old) => ({
        ...old!,
        ...config,
      }));

      // Return context with the snapshot
      return { previousProductTable };
    },
    onError: (_err, variables, context) => {
      // Rollback on error
      const ctx = context as { previousProductTable?: WidgetInstance } | undefined;
      if (ctx?.previousProductTable) {
        queryClient.setQueryData(["productTable", variables.id], ctx.previousProductTable);
      }
    },
    onSuccess: (data, _variables) => {
      // Invalidate product tables list
      queryClient.invalidateQueries({ queryKey: ["productTables"] });
      // Update the specific product table cache
      if (data?.productTableId) {
        queryClient.setQueryData(["productTable", data.productTableId], data);
      }
    },
  });
};

/**
 * Hook to delete a product table
 */
export const useDeleteProductTable = (): UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await api.productTable.delete(id);
    },
    onSuccess: (_data, deletedId) => {
      // Invalidate product tables list
      queryClient.invalidateQueries({ queryKey: ["productTables"] });
      // Remove the deleted product table from cache
      queryClient.removeQueries({ queryKey: ["productTable", deletedId] });
    },
  });
};

/**
 * Hook to duplicate a product table
 */
export const useDuplicateProductTable = (storeId?: string): UseMutationResult<WidgetInstance, Error, WidgetInstance> => {
  const queryClient = useQueryClient();

  return useMutation<WidgetInstance, Error, WidgetInstance>({
    mutationFn: async (sourceProductTable: WidgetInstance) => {
      // Extract only the writable fields (exclude id, createdAt, updatedAt, productTableId)
      const newConfig: any = {
        productTableName: `${sourceProductTable.productTableName} (Copy)`,
        displayFormat: sourceProductTable.displayFormat,
        columns: sourceProductTable.columns,
        columnsOrder: sourceProductTable.columnsOrder,
        productSource: sourceProductTable.productSource,
        selectedCollections: sourceProductTable.selectedCollections,
        selectedCategories: sourceProductTable.selectedCategories,
        targetAllCustomers: sourceProductTable.targetAllCustomers,
        targetRetailOnly: sourceProductTable.targetRetailOnly,
        targetWholesaleOnly: sourceProductTable.targetWholesaleOnly,
        targetLoggedInOnly: sourceProductTable.targetLoggedInOnly,
        targetCustomerTags: sourceProductTable.targetCustomerTags,
        allowViewSwitching: sourceProductTable.allowViewSwitching,
        defaultToTableView: sourceProductTable.defaultToTableView,
        enableCustomerSorting: sourceProductTable.enableCustomerSorting,
        defaultSort: sourceProductTable.defaultSort,
        itemsPerPage: sourceProductTable.itemsPerPage,
        placementLocation: sourceProductTable.placementLocation,
        isActive: sourceProductTable.isActive,
        notes: sourceProductTable.notes,
        version: sourceProductTable.version,
        store: {
          _link: storeId
        }
      };

      const result = await api.productTable.create(newConfig);

      const record = result as any;
      const productTable: WidgetInstance = {
        id: record.id,
        createdAt: safeToISOString(record.createdAt),
        updatedAt: safeToISOString(record.updatedAt),
        productTableId: record.productTableId || '',
        productTableName: record.productTableName || undefined,
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
      return productTable;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productTables"] });
    },
  });
};
