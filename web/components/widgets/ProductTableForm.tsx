import {
  Box,
  Button,
  Checkbox,
  Flex,
  Form,
  FormGroup,
  H2,
  Input,
  Panel,
  Radio,
  Select,
  Text,
  Textarea,
} from "@bigcommerce/big-design";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../../api";
import { useCreateProductTable, useUpdateProductTable } from "../../hooks/useProductTables";
import { useCollections } from "../../hooks/useProducts";
import { ColumnManager } from "./ColumnManager";

import type { Collection, WidgetFormData, WidgetInstance } from "../../types";

interface ProductTableFormProps {
  widgetId?: string;
  initialData?: WidgetInstance;
}

export const ProductTableForm = ({ widgetId, initialData }: ProductTableFormProps) => {
  const navigate = useNavigate();
  const isEdit = !!widgetId;

  // Fetch store
  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  // Fetch collections for selector
  const { data: collectionsData } = useCollections();

  // Mutations
  const createProductTable = useCreateProductTable();
  const updateProductTable = useUpdateProductTable();

  // Form state
  const [formData, setFormData] = useState<WidgetFormData>({
    productTableName: "",
    placementLocation: "homepage",
    displayFormat: "folded",
    columns: ["image", "sku", "name", "price", "stock", "addToCart"],
    columnsOrder: ["image", "sku", "name", "price", "stock", "addToCart"],
    productSource: "all-collections",
    selectedCollections: [],
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
  });

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        productTableName: initialData.productTableName || "",
        placementLocation: initialData.placementLocation || "homepage",
        displayFormat: initialData.displayFormat || "folded",
        columns: initialData.columns || ["image", "sku", "name", "price", "stock", "addToCart"],
        columnsOrder: initialData.columnsOrder || ["image", "sku", "name", "price", "stock", "addToCart"],
        productSource: initialData.productSource || "all-collections",
        selectedCollections: initialData.selectedCollections || [],
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
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const widgetData = {
        ...formData,
        store: {
          _link: store?.id
        },
        version: "1.0.0",
      };

      if (isEdit && widgetId) {
        await updateProductTable.mutateAsync({ id: widgetId, config: widgetData });
      } else {
        await createProductTable.mutateAsync(widgetData);
      }

      navigate("/product-tables");
    } catch (error) {
      console.error("Failed to save widget:", error);
      alert("Failed to save widget");
    }
  };

  const collections: Collection[] = collectionsData || [];

  return (
    <Form onSubmit={handleSubmit}>
      <Box marginBottom="xLarge">
        <H2>{isEdit ? "Edit Product Table" : "Create New Product Table"}</H2>
      </Box>

      {/* Basic Information */}
      <Panel header="Basic Information" marginBottom="medium">
        <FormGroup>
          <Input
            label="Product Table Name"
            placeholder="e.g., Homepage Featured Products"
            value={formData.productTableName}
            onChange={(e) => setFormData({ ...formData, productTableName: e.target.value })}
            required
          />
        </FormGroup>

        <FormGroup>
          <Text bold marginBottom="xSmall">Placement Location</Text>
          <Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Home Page"
                checked={formData.placementLocation === "homepage"}
                onChange={() => setFormData({ ...formData, placementLocation: "homepage" })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Product Detail Page (PDP)"
                checked={formData.placementLocation === "pdp"}
                onChange={() => setFormData({ ...formData, placementLocation: "pdp" })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Category Page"
                checked={formData.placementLocation === "category"}
                onChange={() => setFormData({ ...formData, placementLocation: "category" })}
              />
            </Box>
            <Box>
              <Radio
                label="Custom Page"
                checked={formData.placementLocation === "custom"}
                onChange={() => setFormData({ ...formData, placementLocation: "custom" })}
              />
            </Box>
          </Box>
        </FormGroup>
      </Panel>

      {/* Display Settings */}
      <Panel header="Display Settings" marginBottom="medium">
        <FormGroup>
          <Text bold marginBottom="xSmall">Display Format</Text>
          <Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Folded (Collapsed View)"
                checked={formData.displayFormat === "folded"}
                onChange={() => setFormData({ ...formData, displayFormat: "folded" })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Grouped by Variants"
                checked={formData.displayFormat === "grouped-variants"}
                onChange={() => setFormData({ ...formData, displayFormat: "grouped-variants" })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Radio
                label="Grouped by Category"
                checked={formData.displayFormat === "grouped-category"}
                onChange={() => setFormData({ ...formData, displayFormat: "grouped-category" })}
              />
            </Box>
            <Box>
              <Radio
                label="Grouped by Collection"
                checked={formData.displayFormat === "grouped-collection"}
                onChange={() => setFormData({ ...formData, displayFormat: "grouped-collection" })}
              />
            </Box>
          </Box>
        </FormGroup>

        <FormGroup>
          <Box marginBottom="xSmall">
            <Text bold>Table Columns</Text>
          </Box>
          <ColumnManager
            columns={formData.columns}
            columnsOrder={formData.columnsOrder}
            onChange={(columns, order) => setFormData({
              ...formData,
              columns,
              columnsOrder: order
            })}
          />
        </FormGroup>
      </Panel>

      {/* Product Source */}
      <Panel header="Product Source" marginBottom="medium">
        <FormGroup>
          <Radio
            label="All Collections"
            checked={formData.productSource === "all-collections"}
            onChange={() => setFormData({ ...formData, productSource: "all-collections" })}
          />
          <Radio
            label="Specific Collections"
            checked={formData.productSource === "specific-collections"}
            onChange={() => setFormData({ ...formData, productSource: "specific-collections" })}
          />
          <Radio
            label="Current Category Only"
            checked={formData.productSource === "current-category"}
            onChange={() => setFormData({ ...formData, productSource: "current-category" })}
          />
        </FormGroup>

        {formData.productSource === "specific-collections" && (
          <FormGroup>
            <Select
              label="Select Collections"
              options={collections.map((c: Collection) => ({ value: c.id.toString(), content: c.name }))}
              value={formData.selectedCollections[0] || ""}
              onOptionChange={(value) => setFormData({
                ...formData,
                selectedCollections: value ? [value] : []
              })}
              placeholder="Choose collections..."
            />
          </FormGroup>
        )}
      </Panel>

      {/* Customer Targeting */}
      <Panel header="Customer Targeting" marginBottom="medium">
        <FormGroup>
          <Box>
            <Box marginBottom="xSmall">
              <Checkbox
                label="Show to All Customers"
                checked={formData.targetAllCustomers}
                onChange={(e) => setFormData({ ...formData, targetAllCustomers: e.target.checked })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Checkbox
                label="Retail Customers Only"
                checked={formData.targetRetailOnly}
                onChange={(e) => setFormData({ ...formData, targetRetailOnly: e.target.checked })}
              />
            </Box>
            <Box marginBottom="xSmall">
              <Checkbox
                label="Wholesale Customers Only"
                checked={formData.targetWholesaleOnly}
                onChange={(e) => setFormData({ ...formData, targetWholesaleOnly: e.target.checked })}
              />
            </Box>
            <Box>
              <Checkbox
                label="Logged-in Users Only"
                checked={formData.targetLoggedInOnly}
                onChange={(e) => setFormData({ ...formData, targetLoggedInOnly: e.target.checked })}
              />
            </Box>
          </Box>
        </FormGroup>

        <FormGroup>
          <Input
            label="Customer Tags (comma-separated)"
            placeholder="e.g., vip, wholesale, preferred"
            value={formData.targetCustomerTags?.join(", ") || ""}
            onChange={(e) => setFormData({
              ...formData,
              targetCustomerTags: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
            })}
          />
        </FormGroup>
      </Panel>

      {/* View Options */}
      <Panel header="View Options" marginBottom="medium">
        <FormGroup>
          <Checkbox
            label="Allow View Switching (Grid ↔ Table)"
            checked={formData.allowViewSwitching}
            onChange={(e) => setFormData({ ...formData, allowViewSwitching: e.target.checked })}
          />
        </FormGroup>

        <FormGroup>
          <Checkbox
            label="Default to Table View"
            checked={formData.defaultToTableView}
            onChange={(e) => setFormData({ ...formData, defaultToTableView: e.target.checked })}
          />
        </FormGroup>
      </Panel>

      {/* Sorting & Pagination */}
      <Panel header="Sorting & Pagination" marginBottom="medium">
        <FormGroup>
          <Select
            label="Default Sort"
            options={[
              { value: "name", content: "Name" },
              { value: "price-asc", content: "Price: Low to High" },
              { value: "price-desc", content: "Price: High to Low" },
              { value: "newest", content: "Newest First" },
              { value: "oldest", content: "Oldest First" },
              { value: "sku", content: "SKU" },
            ]}
            value={formData.defaultSort || "name"}
            onOptionChange={(value) => setFormData({ ...formData, defaultSort: value as any })}
          />
        </FormGroup>

        <FormGroup>
          <Select
            label="Items Per Page"
            options={[
              { value: "10", content: "10" },
              { value: "25", content: "25" },
              { value: "50", content: "50" },
              { value: "100", content: "100" },
            ]}
            value={(formData.itemsPerPage || 25).toString()}
            onOptionChange={(value) => setFormData({ ...formData, itemsPerPage: value ? parseInt(value, 10) : 25 })}
          />
        </FormGroup>

        <FormGroup>
          <Checkbox
            label="Enable Customer Sorting"
            checked={formData.enableCustomerSorting}
            onChange={(e) => setFormData({ ...formData, enableCustomerSorting: e.target.checked })}
          />
        </FormGroup>
      </Panel>

      {/* Status & Notes */}
      <Panel header="Status & Notes" marginBottom="medium">
        <FormGroup>
          <Checkbox
            label="Product Table Active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
          />
        </FormGroup>

        <FormGroup>
          <Textarea
            label="Notes"
            placeholder="Add any notes about this widget configuration..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
          />
        </FormGroup>
      </Panel>

      {/* Actions */}
      <Flex justifyContent="flex-end" marginTop="large">
        <Button
          variant="subtle"
          onClick={() => navigate("/product-tables")}
          type="button"
          marginRight="small"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          isLoading={createProductTable.isPending || updateProductTable.isPending}
        >
          {isEdit ? "Update Product Table" : "Create Product Table"}
        </Button>
      </Flex>
    </Form>
  );
};
