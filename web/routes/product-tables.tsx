import {
  Badge,
  Box,
  Button,
  Flex,
  H1,
  Link,
  Modal,
  Panel,
  ProgressCircle,
  Text,
  Textarea,
} from "@bigcommerce/big-design";
import { AddIcon, CodeIcon, DeleteIcon, EditIcon, FileCopyIcon } from "@bigcommerce/big-design-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useDeleteProductTable, useDuplicateProductTable, useProductTables } from "../hooks/useProductTables";
import type { WidgetInstance } from "../types";

export const ProductTablesPage = () => {
  const navigate = useNavigate();
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [selectedProductTable, setSelectedProductTable] = useState<WidgetInstance | null>(null);

  // Fetch current store
  const { data: store, isLoading: storeLoading } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  // Fetch product tables for this store
  const { data: productTables, isLoading: productTablesLoading, error } = useProductTables(store?.id);

  // Mutations
  const deleteProductTable = useDeleteProductTable();
  const duplicateProductTable = useDuplicateProductTable(store?.id);

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProductTable.mutateAsync(id);
      } catch (error) {
        console.error("Failed to delete product table:", error);
        alert("Failed to delete product table");
      }
    }
  };

  const handleDuplicate = async (productTable: WidgetInstance) => {
    try {
      const newProductTable = await duplicateProductTable.mutateAsync(productTable);
      if (newProductTable) {
        navigate(`/product-tables/${newProductTable.id}/edit`);
      }
    } catch (error) {
      console.error("Failed to duplicate product table:", error);
      alert("Failed to duplicate product table");
    }
  };

  const handleShowEmbed = (productTable: WidgetInstance) => {
    setSelectedProductTable(productTable);
    setEmbedModalOpen(true);
  };

  const getEmbedCode = (productTableId: string) => {
    const gadgetAppUrl = window.location.origin;
    return `<!-- Product Table: ${productTableId} -->
<div id="product-table-${productTableId}" data-product-table-widget="${productTableId}"></div>
<script src="${gadgetAppUrl}/widget-loader.js"></script>`;
  };

  const copyEmbedCode = () => {
    if (selectedProductTable) {
      navigator.clipboard.writeText(getEmbedCode(selectedProductTable.productTableId));
      alert("Embed code copied to clipboard!");
    }
  };

  if (storeLoading || productTablesLoading) {
    return (
      <Flex justifyContent="center" alignItems="center" padding="xxxLarge">
        <ProgressCircle />
      </Flex>
    );
  }

  if (error) {
    return (
      <Panel header="Error">
        <Text color="danger">Failed to load product tables: {(error as Error).message}</Text>
      </Panel>
    );
  }

  // Ensure product tables is always an array
  const productTableData: WidgetInstance[] = Array.isArray(productTables) ? productTables : [];

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="medium">
        <H1>Product Tables</H1>
        <Button
          variant="secondary"
          iconLeft={<AddIcon />}
          onClick={() => navigate("/product-tables/new")}
        >
          Create New Product Table
        </Button>
      </Flex>

      {productTableData.length > 0 && (
        <Panel marginBottom="medium">
          <Box padding="medium">
            <Text bold marginBottom="xSmall">📋 How to Add Product Tables to Your Storefront</Text>
            <Text marginBottom="xSmall">
              1. Create a product table using the "Create New Product Table" button above
            </Text>
            <Text marginBottom="xSmall">
              2. Configure columns, targeting, and display settings
            </Text>
            <Text marginBottom="xSmall">
              3. Click the code icon ({"<>"}) to get the embed code or copy the Product Table ID
            </Text>
            <Text>
              4. In BigCommerce Page Builder, add a "Product Table Widget" and paste the Product Table ID
            </Text>
          </Box>
        </Panel>
      )}

      {productTableData.length === 0 ? (
        <Panel>
          <Flex flexDirection="column" alignItems="center" padding="xxxLarge">
            <Text marginBottom="medium">No product tables created yet</Text>
            <Text color="secondary60" marginBottom="large">
              Create your first product table to get started
            </Text>
            <Button
              iconLeft={<AddIcon />}
              variant="secondary"
              onClick={() => navigate("/product-tables/new")}
            >
              Create Product Table
            </Button>
          </Flex>
        </Panel>
      ) : (
        <Panel>
          <Box padding="medium">
            {productTableData.map((productTable: WidgetInstance) => (
              <Flex
                key={productTable.id}
                justifyContent="space-between"
                alignItems="center"
                padding="medium"
                borderBottom="box"
              >
                <Box>
                  <Link onClick={() => navigate(`/product-tables/${productTable.id}/edit`)}>
                    <Text bold>{productTable.productTableName || "Unnamed Product Table"}</Text>
                  </Link>
                  <Flex alignItems="center" marginTop="xSmall">
                    <Text color="secondary60" marginRight="xSmall">
                      Product Table ID: {productTable.productTableId}
                    </Text>
                    <Button
                      variant="subtle"
                      iconOnly={<FileCopyIcon />}
                      onClick={() => {
                        navigator.clipboard.writeText(productTable.productTableId);
                        alert(`Product Table ID copied: ${productTable.productTableId}`);
                      }}
                      aria-label="Copy Product Table ID"
                    />
                  </Flex>
                </Box>
                <Flex alignItems="center">
                  <Badge
                    label={productTable.placementLocation || "Not Set"}
                    variant={productTable.placementLocation ? "secondary" : "warning"}
                    marginRight="small"
                  />
                  <Badge
                    label={productTable.isActive ? "Active" : "Inactive"}
                    variant={productTable.isActive ? "success" : "secondary"}
                    marginRight="small"
                  />
                  <Button
                    iconLeft={<CodeIcon />}
                    variant="secondary"
                    onClick={() => handleShowEmbed(productTable)}
                    aria-label="Show Embed Code"
                    marginRight="xSmall"
                  >
                    Code
                  </Button>
                  <Button
                    iconLeft={<EditIcon />}
                    variant="primary"
                    onClick={() => navigate(`/product-tables/${productTable.id}/edit`)}
                    aria-label="Edit"
                    marginRight="xSmall"
                  >
                    Edit
                  </Button>
                  <Button
                    iconLeft={<FileCopyIcon />}
                    variant="secondary"
                    onClick={() => handleDuplicate(productTable)}
                    isLoading={duplicateProductTable.isPending}
                    aria-label="Duplicate Product Table"
                    marginRight="xSmall"
                  >
                    Duplicate
                  </Button>
                  <Button
                    iconLeft={<DeleteIcon />}
                    variant="subtle"
                    onClick={() => handleDelete(productTable.id, productTable.productTableName || "Unnamed Product Table")}
                    isLoading={deleteProductTable.isPending}
                    aria-label="Delete"
                  >
                    Delete
                  </Button>
                </Flex>
              </Flex>
            ))}
          </Box>
        </Panel>
      )}

      <Box marginTop="medium">
        <Text color="secondary60">
          Total product tables: {productTableData.length}
        </Text>
      </Box>

      {/* Embed Code Modal */}
      <Modal
        isOpen={embedModalOpen}
        onClose={() => setEmbedModalOpen(false)}
        header={`Embed Code: ${selectedProductTable?.productTableName || 'Product Table'}`}
        actions={[
          {
            text: "Copy Code",
            onClick: copyEmbedCode,
            variant: "primary",
          },
          {
            text: "Close",
            onClick: () => setEmbedModalOpen(false),
            variant: "subtle",
          },
        ]}
      >
        <Box>
          <Text marginBottom="small">
            Use this code to add the product table to your storefront theme files:
          </Text>
          <Textarea
            value={selectedProductTable ? getEmbedCode(selectedProductTable.productTableId) : ""}
            readOnly
            rows={4}
            resize={true}
          />
          <Text marginTop="medium" bold>
            Or for Page Builder:
          </Text>
          <Text marginTop="xSmall">
            1. Add a "Product Table Widget" to your page
          </Text>
          <Text marginTop="xSmall">
            2. In the widget settings, paste this Product Table ID:
          </Text>
          <Box
            backgroundColor="secondary10"
            padding="small"
            marginTop="xSmall"
            style={{ fontFamily: "monospace", borderRadius: "4px" }}
          >
            {selectedProductTable?.productTableId}
          </Box>
        </Box>
      </Modal>
    </Box>
  );
};
