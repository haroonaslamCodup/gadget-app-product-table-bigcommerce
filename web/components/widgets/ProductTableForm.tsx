import {
  AlertsManager,
  Box,
  Button,
  Checkbox,
  createAlertsManager,
  Flex,
  Form,
  FormGroup,
  H2,
  Input,
  Message,
  Panel,
  Select,
  Small,
  Textarea,
} from "@bigcommerce/big-design";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../api";
import { useCreateProductTable, useUpdateProductTable } from "../../hooks/useProductTables";
import { CategorySelector } from "./CategorySelector";
import { ColumnManager } from "./ColumnManager";

import type { ProductTableFormData, ProductTableInstance } from "../../types";

const alertsManager = createAlertsManager();

interface ProductTableFormProps {
  widgetId?: string;
  initialData?: ProductTableInstance;
}

export const ProductTableForm = ({ widgetId, initialData }: ProductTableFormProps) => {
  const navigate = useNavigate();
  const isEdit = !!widgetId;

  // Fetch store
  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  // Mutations
  const createProductTable = useCreateProductTable();
  const updateProductTable = useUpdateProductTable();

  // Form state
  const [formData, setFormData] = useState<ProductTableFormData>({
    productTableName: "",
    placementLocation: "homepage",
    displayFormat: "folded",
    columns: ["image", "sku", "name", "price", "stock", "addToCart"],
    columnsOrder: ["image", "sku", "name", "price", "stock", "addToCart"],
    productSource: "all-products",
    selectedCategories: [],
    targetAllCustomers: true,
    targetRetailOnly: false,
    targetWholesaleOnly: false,
    targetCustomerTags: [],
    targetLoggedInOnly: false,
    allowViewSwitching: true,
    defaultToTableView: false,
    defaultSort: "name",
    itemsPerPage: 25,
    enableCustomerSorting: true,
    isActive: true,
    notes: "",
    showVariantsOnPDP: false,
    variantColumns: ["image", "sku", "name", "price", "stock", "addToCart"],
  });

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        productTableName: initialData.productTableName || "",
        placementLocation: initialData.placementLocation || "homepage",
        displayFormat: initialData.displayFormat || "folded",
        columns: initialData.columns || ["image", "sku", "name", "price", "stock", "addToCart"],
        columnsOrder: initialData.columnsOrder || ["image", "sku", "name", "price", "stock", "addToCart"],
        productSource: initialData.productSource || "all-products",
        selectedCategories: initialData.selectedCategories || [],
        targetAllCustomers: initialData.targetAllCustomers ?? true,
        targetRetailOnly: initialData.targetRetailOnly ?? false,
        targetWholesaleOnly: initialData.targetWholesaleOnly ?? false,
        targetCustomerTags: initialData.targetCustomerTags || [],
        targetLoggedInOnly: initialData.targetLoggedInOnly ?? false,
        allowViewSwitching: initialData.allowViewSwitching ?? true,
        defaultToTableView: initialData.defaultToTableView ?? false,
        defaultSort: initialData.defaultSort || "name",
        itemsPerPage: initialData.itemsPerPage || 25,
        enableCustomerSorting: initialData.enableCustomerSorting ?? true,
        isActive: initialData.isActive ?? true,
        notes: initialData.notes || "",
        showVariantsOnPDP: initialData.showVariantsOnPDP ?? false,
        variantColumns: initialData.variantColumns || ["image", "sku", "name", "price", "stock", "addToCart"],
      });
    }
  }, [initialData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.productTableName.trim()) {
      newErrors.productTableName = "Product table name is required";
    }

    if (formData.columns.length === 0) {
      newErrors.columns = "At least one column must be selected";
    }

    const targetingOptions = [formData.targetRetailOnly, formData.targetWholesaleOnly, formData.targetLoggedInOnly];
    if (!formData.targetAllCustomers && !targetingOptions.some(opt => opt)) {
      newErrors.customerTargeting = "Please select at least one customer targeting option";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alertsManager.add({
        messages: [{ text: "Please fix the errors before submitting." }],
        type: "error",
        autoDismiss: true,
      });
      return;
    }

    try {
      const widgetData = {
        ...formData,
        store: {
          _link: store?.id
        },
        version: "1.0.0",
        // Generate productTableId for new tables
        ...(!isEdit && { productTableId: crypto.randomUUID() }),
      };

      if (isEdit && widgetId) {
        await updateProductTable.mutateAsync({ id: widgetId, config: widgetData });
        alertsManager.add({
          messages: [{ text: "Product table updated successfully!" }],
          type: "success",
          autoDismiss: true,
        });
      } else {
        await createProductTable.mutateAsync(widgetData);
        alertsManager.add({
          messages: [{ text: "Product table created successfully!" }],
          type: "success",
          autoDismiss: true,
        });
      }

      setTimeout(() => navigate("/product-tables"), 1000);
    } catch (error) {
      alertsManager.add({
        messages: [{ text: `Failed to save: ${(error as Error).message}` }],
        type: "error",
        autoDismiss: false,
      });
    }
  };

  return (
    <>
      <AlertsManager manager={alertsManager} />

      <Box marginBottom="xxLarge">
        <H2>{isEdit ? "Edit Product Table" : "Create New Product Table"}</H2>
        <Small color="secondary60">Configure your product table widget settings</Small>
      </Box>

      <Form onSubmit={handleSubmit}>
        {/* Basic Information Panel */}
        <Panel header="Basic Information" marginBottom="medium">
          <Flex flexDirection="row" flexGap="medium" flexWrap="wrap">
            <Box style={{ flex: 1 }}>
              <Input
                label="Product Table Name"
                description="Give your product table a descriptive name for easy identification"
                placeholder="e.g., Homepage Featured Products"
                value={formData.productTableName}
                onChange={(e) => {
                  setFormData({ ...formData, productTableName: e.target.value });
                  if (errors.productTableName) setErrors({ ...errors, productTableName: "" });
                }}
                error={errors.productTableName}
                required
              />
            </Box>

            <Box style={{ flex: 1 }}>
              <Select
                label="Placement Location"
                description="Choose where this product table will be displayed on your store"
                options={[
                  { value: "homepage", content: "Home Page" },
                  { value: "pdp", content: "Product Detail Page (PDP)" },
                  { value: "category", content: "Category Page" },
                  { value: "custom", content: "Custom Page" },
                ]}
                value={formData.placementLocation}
                onOptionChange={(value) => setFormData({ ...formData, placementLocation: value as any })}
                required
              />
            </Box>
          </Flex>

          <FormGroup>
            <Select
              label="Product Source"
              description="Select which products to display in the table"
              options={[
                { value: "all-products", content: "All Products" },
                { value: "specific-categories", content: "Specific Categories" },
                ...(formData.placementLocation === "pdp"
                  ? [{ value: "current-product-variants", content: "Current Product Variants (PDP only)" }]
                  : []
                ),
              ]}
              value={formData.productSource}
              onOptionChange={(value) => {
                setFormData({
                  ...formData,
                  productSource: value as any,
                  // Auto-enable variant display when selecting current-product-variants
                  showVariantsOnPDP: value === "current-product-variants" ? true : formData.showVariantsOnPDP,
                });
              }}
            />
          </FormGroup>

          {formData.productSource === "specific-categories" && (
            <FormGroup>
              <CategorySelector
                selectedCategories={formData.selectedCategories}
                onChange={(selected) => {
                  setFormData({
                    ...formData,
                    selectedCategories: selected,
                  });
                }}
              />
            </FormGroup>
          )}

          {/* PDP Variant Display Settings */}
          {formData.placementLocation === "pdp" && (
            <FormGroup>
              <Checkbox
                label="Show Product Variants in Table"
                description="Display all variants of the current product in an easy-to-purchase table format"
                checked={formData.showVariantsOnPDP || formData.productSource === "current-product-variants"}
                disabled={formData.productSource === "current-product-variants"}
                onChange={(e) => setFormData({
                  ...formData,
                  showVariantsOnPDP: e.target.checked,
                  // Auto-switch product source when enabling variants
                  productSource: e.target.checked ? "current-product-variants" : "all-products"
                })}
              />
              {formData.showVariantsOnPDP && (
                <Box marginTop="xSmall">
                  <Small color="secondary60">
                    💡 Perfect for products with multiple sizes, colors, or options. Customers can easily compare and purchase variants directly from the table.
                  </Small>
                </Box>
              )}
            </FormGroup>
          )}
        </Panel>

        {/* Display Settings Panel */}
        <Panel header="Display Settings" marginBottom="medium">
          <FormGroup>
            <Select
              label="Display Format"
              description="Choose how products are organized in the table"
              options={[
                { value: "folded", content: "Folded (Collapsed View)" },
                { value: "grouped-variants", content: "Grouped by Variants" },
                { value: "grouped-category", content: "Grouped by Category" },
              ]}
              value={formData.displayFormat}
              onOptionChange={(value) => setFormData({ ...formData, displayFormat: value as any })}
            />
          </FormGroup>

          {errors.columns && (
            <Message type="error" messages={[{ text: errors.columns }]} marginBottom="small" />
          )}
          <ColumnManager
            columns={formData.columns}
            columnsOrder={formData.columnsOrder}
            onChange={(columns, order) => {
              setFormData({ ...formData, columns, columnsOrder: order });
              if (errors.columns) setErrors({ ...errors, columns: "" });
            }}
          />

          <FormGroup>
            <Checkbox
              label="Allow View Switching (Grid ↔ Table)"
              description="Let customers toggle between grid and table views"
              checked={formData.allowViewSwitching}
              onChange={(e) => setFormData({ ...formData, allowViewSwitching: e.target.checked })}
            />
          </FormGroup>

          <FormGroup>
            <Checkbox
              label="Default to Table View"
              description="Start in table view instead of grid view"
              checked={formData.defaultToTableView}
              onChange={(e) => setFormData({ ...formData, defaultToTableView: e.target.checked })}
            />
          </FormGroup>
        </Panel>

        {/* Sorting & Pagination Panel */}
        <Panel header="Sorting & Pagination" marginBottom="medium">
          <Flex flexDirection="row" flexGap="medium">
            <Box style={{ flex: 1 }}>
              <Select
                label="Default Sort"
                description="Initial sort order when table loads"
                options={[
                  { value: "name", content: "Name" },
                  { value: "price-asc", content: "Price: Low to High" },
                  { value: "price-desc", content: "Price: High to Low" },
                  { value: "newest", content: "Newest First" },
                  { value: "oldest", content: "Oldest First" },
                  { value: "sku", content: "SKU" },
                ]}
                value={formData.defaultSort}
                onOptionChange={(value) => setFormData({ ...formData, defaultSort: value as any })}
              />
            </Box>

            <Box style={{ flex: 1 }}>
              <Select
                label="Items Per Page"
                description="Number of products to display per page"
                options={[
                  { value: "10", content: "10 items" },
                  { value: "25", content: "25 items" },
                  { value: "50", content: "50 items" },
                ]}
                value={formData.itemsPerPage.toString()}
                onOptionChange={(value) => setFormData({ ...formData, itemsPerPage: parseInt(value || "25", 10) })}
              />
            </Box>
          </Flex>

          <FormGroup>
            <Checkbox
              label="Enable Customer Sorting"
              description="Allow customers to re-sort the table by different columns"
              checked={formData.enableCustomerSorting}
              onChange={(e) => setFormData({ ...formData, enableCustomerSorting: e.target.checked })}
            />
          </FormGroup>
        </Panel>

        {/* Customer Targeting Panel */}
        <Panel header="Customer Targeting" marginBottom="medium">
          {errors.customerTargeting && (
            <Message type="error" messages={[{ text: errors.customerTargeting }]} marginBottom="medium" />
          )}

          <FormGroup>
            <Checkbox
              label="Show to All Customers"
              description="Display to everyone including guests"
              checked={formData.targetAllCustomers}
              onChange={(e) => {
                setFormData({ ...formData, targetAllCustomers: e.target.checked });
                if (errors.customerTargeting) setErrors({ ...errors, customerTargeting: "" });
              }}
            />
          </FormGroup>

          <FormGroup>
            <Checkbox
              label="Retail Customers Only"
              description="Show only to retail customer group"
              checked={formData.targetRetailOnly}
              disabled={formData.targetAllCustomers}
              onChange={(e) => {
                setFormData({ ...formData, targetRetailOnly: e.target.checked });
                if (errors.customerTargeting) setErrors({ ...errors, customerTargeting: "" });
              }}
            />
          </FormGroup>

          <FormGroup>
            <Checkbox
              label="Wholesale Customers Only"
              description="Show only to wholesale customer group"
              checked={formData.targetWholesaleOnly}
              disabled={formData.targetAllCustomers}
              onChange={(e) => {
                setFormData({ ...formData, targetWholesaleOnly: e.target.checked });
                if (errors.customerTargeting) setErrors({ ...errors, customerTargeting: "" });
              }}
            />
          </FormGroup>

          <FormGroup>
            <Checkbox
              label="Logged-in Users Only"
              description="Require users to be logged in to see this table"
              checked={formData.targetLoggedInOnly}
              disabled={formData.targetAllCustomers}
              onChange={(e) => {
                setFormData({ ...formData, targetLoggedInOnly: e.target.checked });
                if (errors.customerTargeting) setErrors({ ...errors, customerTargeting: "" });
              }}
            />
          </FormGroup>

          <FormGroup>
            <Input
              label="Customer Tags (comma-separated)"
              description="Optionally target customers with specific tags"
              placeholder="e.g., vip, wholesale, preferred"
              value={formData.targetCustomerTags?.join(", ") || ""}
              onChange={(e) => setFormData({
                ...formData,
                targetCustomerTags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
              })}
            />
          </FormGroup>
        </Panel>

        {/* Status & Notes Panel */}
        <Panel header="Status & Notes" marginBottom="medium">
          <FormGroup>
            <Checkbox
              label="Product Table Active"
              description="Deactivate to hide this table without deleting the configuration"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            />
          </FormGroup>

          <FormGroup>
            <Textarea
              label="Notes"
              description="Internal notes about this configuration (not visible to customers)"
              placeholder="Add any notes about this widget configuration..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
            />
          </FormGroup>
        </Panel>

        {/* Actions */}
        <Box marginTop="xxLarge">
          <Flex justifyContent="flex-end">
            <Button
              variant="subtle"
              onClick={() => navigate("/product-tables")}
              type="button"
              marginRight="medium"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              type="submit"
              isLoading={createProductTable.isPending || updateProductTable.isPending}
              disabled={!formData.productTableName.trim()}
            >
              {isEdit ? "Update Product Table" : "Create Product Table"}
            </Button>
          </Flex>
        </Box>
      </Form>
    </>
  );
};
