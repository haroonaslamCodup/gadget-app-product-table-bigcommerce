import {
  AlertsManager,
  Text as BigText,
  Box,
  Button,
  Checkbox,
  createAlertsManager,
  Flex,
  Form,
  H2,
  Input,
  Message,
  Panel,
  Select,
  Small,
  Text,
  Textarea,
} from "@bigcommerce/big-design";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import styled from "styled-components";
import { api } from "../../api";
import {
  useCreateProductTable,
  useUpdateProductTable,
} from "../../hooks/useProductTables";
import { useGlobalInstallWidget } from "../../hooks/useGlobalInstall";
import type { ProductTableFormData, ProductTableInstance } from "../../types";
import { CategorySelector } from "./CategorySelector";
import { ColumnManager } from "./ColumnManager";

// ✅ Responsive GridBox: creates 1 column on mobile, 2 on tablet/desktop
const GridBox = styled(Box)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  gap: ${({ theme }) => theme.spacing.medium};
`;

const alertsManager = createAlertsManager();

interface ProductTableFormProps {
  widgetId?: string;
  initialData?: ProductTableInstance;
}

export const ProductTableForm = ({
  widgetId,
  initialData,
}: ProductTableFormProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEdit = !!widgetId;

  const tableTypeFromUrl = searchParams.get("type") as "normal" | "variant" | null;
  const initialTableType = tableTypeFromUrl || "normal";

  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  const createProductTable = useCreateProductTable();
  const updateProductTable = useUpdateProductTable();
  const globalInstall = useGlobalInstallWidget();

  const [formData, setFormData] = useState<ProductTableFormData>({
    productTableName: "",
    placementLocation: initialTableType === "variant" ? "pdp" : "homepage",
    displayFormat: "folded",
    columns: ["image", "name", "sku", "price", "stock", "addToCart"],
    columnsOrder: ["image", "name", "sku", "price", "stock", "addToCart"],
    columnLabels: {},
    productSource:
      initialTableType === "variant" ? "current-product-variants" : "all-products",
    selectedCategories: [],
    targetAllCustomers: true,
    targetRetailOnly: false,
    targetWholesaleOnly: false,
    targetLoggedInOnly: false,
    defaultSort: "name",
    itemsPerPage: 25,
    enableCustomerSorting: true,
    isActive: true,
    tableType: initialTableType,
    notes: "",
    showVariantsOnPDP: initialTableType === "variant",
    variantColumns: ["image", "name", "sku", "price", "stock", "addToCart"],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      // Define valid column IDs
      const validColumnIds = ["image", "name", "sku", "price", "stock", "addToCart"];

      // Filter out any invalid column IDs from initialData
      const sanitizedColumns = (initialData.columns || []).filter(col => validColumnIds.includes(col));
      const sanitizedOrder = (initialData.columnsOrder || []).filter(col => validColumnIds.includes(col));

      // Ensure required columns are present
      const finalColumns = Array.from(new Set(["image", "name", ...sanitizedColumns]));
      const finalOrder = ["image", "name", ...sanitizedOrder.filter(col => !["image", "name"].includes(col))];

      setFormData({
        ...formData,
        ...initialData,
        columns: finalColumns,
        columnsOrder: finalOrder,
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
    const targetingOptions = [
      formData.targetRetailOnly,
      formData.targetWholesaleOnly,
      formData.targetLoggedInOnly,
    ];
    if (!formData.targetAllCustomers && !targetingOptions.some((opt) => opt)) {
      newErrors.customerTargeting =
        "Please select at least one customer targeting option";
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
        store: { _link: store?.id },
        version: "1.0.0",
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

  const handleGlobalInstall = async () => {
    if (!initialData?.productTableId) {
      alertsManager.add({
        messages: [{ text: "Product Table ID not found. Please save the product table first." }],
        type: "error",
        autoDismiss: true,
      });
      return;
    }

    if (!confirm(
      "This will install this product table globally on all category pages using BigCommerce Widgets API.\n\n" +
      "Are you sure you want to continue?"
    )) {
      return;
    }

    try {
      await globalInstall.mutateAsync({
        productTableId: initialData.productTableId,
      });

      alertsManager.add({
        messages: [{
          text: "✅ Product table installed globally on all category pages! " +
                "The widget will now appear on every category page automatically."
        }],
        type: "success",
        autoDismiss: false,
      });
    } catch (error) {
      alertsManager.add({
        messages: [{
          text: `Failed to install globally: ${(error as Error).message}. ` +
                `You can still add it manually using Page Builder.`
        }],
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
        <Small color="secondary60">
          Configure your product table widget settings
        </Small>
      </Box>

      <Form onSubmit={handleSubmit}>
        <Panel header="Basic Information" marginBottom="xLarge">
          {!isEdit && (
            <Box marginBottom="medium">
              <BigText>
                <strong>Table Type:</strong>{" "}
                {formData.tableType === "variant"
                  ? "Variant Product Table (PDP Only)"
                  : "Normal Product Table"}
              </BigText>
              {formData.tableType === "variant" && (
                <Small color="secondary60">
                  💡 Displays all variants of a product on the PDP.
                </Small>
              )}
            </Box>
          )}

          {/* ✅ Two-column responsive grid */}
          <GridBox marginBottom="medium">
            <Input
              width="100%"
              label="Product Table Name"
              description="Give your table a descriptive name"
              placeholder="e.g., Homepage Featured Products"
              value={formData.productTableName}
              onChange={(e) =>
                setFormData({ ...formData, productTableName: e.target.value })
              }
              error={errors.productTableName}
              required
            />

            {formData.tableType !== "variant" && (
              <Select
                width="100%"
                label="Placement Location"
                description="Where this table appears on your store"
                options={[
                  { value: "homepage", content: "Home Page" },
                  { value: "category", content: "Category Page" },
                  { value: "custom", content: "Custom Page" },
                ]}
                value={formData.placementLocation}
                onOptionChange={(value) =>
                  setFormData({ ...formData, placementLocation: value as any })
                }
              />
            )}
          </GridBox>

          <Box marginBottom="medium">
            <Select
              label="Product Source"
              description="Select which products to display"
              options={[
                { value: "all-products", content: "All Products" },
                { value: "specific-categories", content: "Specific Categories" },
                { value: "current-category", content: "Current Category (Auto-detect)" },
                ...(formData.tableType === "variant" ||
                  formData.placementLocation === "pdp"
                  ? [
                    {
                      value: "current-product-variants",
                      content: "Current Product Variants (PDP only)",
                    },
                  ]
                  : []),
              ]}
              value={formData.productSource}
              onOptionChange={(value) =>
                setFormData({
                  ...formData,
                  productSource: value as any,
                  showVariantsOnPDP:
                    value === "current-product-variants"
                      ? true
                      : formData.showVariantsOnPDP,
                })
              }
            />
          </Box>

          {formData.productSource === "current-category" && (
            <Box marginBottom="medium">
              <Message
                type="info"
                messages={[
                  {
                    text: "💡 This Product Table will automatically detect the current category and display products from that category. Perfect for placing on category page templates!"
                  }
                ]}
              />
            </Box>
          )}

          {formData.productSource === "specific-categories" && (
            <Box marginBottom="medium">
              <CategorySelector
                selectedCategories={formData.selectedCategories}
                onChange={(selected) =>
                  setFormData({ ...formData, selectedCategories: selected })
                }
              />
            </Box>
          )}

          <GridBox marginBottom="medium">
            <Checkbox
              label="Active"
              description="Deactivate to hide this table"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
            />

            <Box />
          </GridBox>

          <Box marginBottom="medium">
            <Textarea
              label="Notes"
              description="Internal notes (not visible to customers)"
              placeholder="Add any notes about this configuration..."
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
            />
          </Box>
        </Panel>

        {/* 🧩 DISPLAY SETTINGS */}
        <Panel header="Display Settings" marginBottom="xLarge">
          <Box marginBottom="medium">
            <Select
              label="Display Format"
              options={[
                { value: "folded", content: "Folded (Collapsed)" },
                { value: "unfolded", content: "Unfolded (Expanded)" },
                { value: "grouped", content: "Grouped" },
              ]}
              value={formData.displayFormat}
              onOptionChange={(value) =>
                setFormData({ ...formData, displayFormat: value as any })
              }
            />
          </Box>

          {errors.columns && (
            <Message type="error" messages={[{ text: errors.columns }]} marginBottom="medium" />
          )}

          <ColumnManager
            columns={formData.columns}
            columnsOrder={formData.columnsOrder}
            columnLabels={formData.columnLabels}
            onChange={(columns, order, labels) =>
              setFormData({
                ...formData,
                columns,
                columnsOrder: order,
                columnLabels: labels,
              })
            }
          />
        </Panel>

        {/* 🔢 SORTING & PAGINATION */}
        <Panel header="Sorting & Pagination" marginBottom="xLarge">
          <GridBox>
            <Select
              label="Default Sort"
              options={[
                { value: "name", content: "Name" },
                { value: "price-asc", content: "Price: Low to High" },
                { value: "price-desc", content: "Price: High to Low" },
                { value: "newest", content: "Newest" },
                { value: "oldest", content: "Oldest" },
              ]}
              value={formData.defaultSort}
              onOptionChange={(value) =>
                setFormData({ ...formData, defaultSort: value as any })
              }
            />

            <Select
              label="Items Per Page"
              options={[
                { value: "10", content: "10" },
                { value: "25", content: "25" },
                { value: "50", content: "50" },
              ]}
              value={formData.itemsPerPage.toString()}
              onOptionChange={(value) =>
                setFormData({
                  ...formData,
                  itemsPerPage: parseInt(value || "25", 10),
                })
              }
            />
          </GridBox>
        </Panel>

        {/* 🎯 CUSTOMER TARGETING */}
        <Panel header="Customer Targeting" marginBottom="xLarge">
          {errors.customerTargeting && (
            <Message
              type="error"
              messages={[{ text: errors.customerTargeting }]}
              marginBottom="medium"
            />
          )}

          <Box marginBottom="medium">
            <Checkbox
              label="Show to All Customers"
              checked={formData.targetAllCustomers}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetAllCustomers: e.target.checked,
                })
              }
            />
          </Box>

          <GridBox>
            <Checkbox
              label="Retail Customers Only"
              disabled={formData.targetAllCustomers}
              checked={formData.targetRetailOnly}
              onChange={(e) =>
                setFormData({ ...formData, targetRetailOnly: e.target.checked })
              }
            />
            <Checkbox
              label="Wholesale Customers Only"
              disabled={formData.targetAllCustomers}
              checked={formData.targetWholesaleOnly}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetWholesaleOnly: e.target.checked,
                })
              }
            />
            <Checkbox
              label="Logged-in Users Only"
              disabled={formData.targetAllCustomers}
              checked={formData.targetLoggedInOnly}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  targetLoggedInOnly: e.target.checked,
                })
              }
            />
          </GridBox>
        </Panel>

        {/* 🚀 GLOBAL INSTALLATION (Only show in edit mode for category placement) */}
        {isEdit && formData.placementLocation === "category" && (
          <Panel header="Global Installation" marginBottom="xLarge">
            <Box marginBottom="medium">
              <BigText bold>Install on All Category Pages</BigText>
              <Text color="secondary60" marginTop="xSmall">
                This will automatically place this product table on all category pages using BigCommerce Widgets API.
                You won't need to manually add it to each category via Page Builder.
              </Text>
            </Box>

            <Message
              type="info"
              messages={[
                {
                  text: "💡 After global installation, this widget will appear on every category page automatically. " +
                        "It will auto-detect the category and show the correct products."
                }
              ]}
              marginBottom="medium"
            />

            <Button
              variant="secondary"
              onClick={handleGlobalInstall}
              isLoading={globalInstall.isPending}
              disabled={!initialData?.productTableId}
            >
              {globalInstall.isPending ? "Installing..." : "Install Globally on All Category Pages"}
            </Button>

            {!initialData?.productTableId && (
              <Small color="secondary60" marginTop="xSmall">
                Save the product table first to enable global installation
              </Small>
            )}
          </Panel>
        )}

        {/* 🧭 ACTIONS */}
        <Flex justifyContent="flex-end" marginTop="xxLarge">
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
            isLoading={
              createProductTable.isPending || updateProductTable.isPending
            }
            disabled={!formData.productTableName.trim()}
          >
            {isEdit ? "Update Product Table" : "Create Product Table"}
          </Button>
        </Flex>
      </Form>
    </>
  );
};
