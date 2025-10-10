import {
  Badge,
  Box,
  Button,
  Flex,
  H1,
  Modal,
  Panel,
  ProgressCircle,
  Text,
  Textarea,
} from "@bigcommerce/big-design";
import { AddIcon, CodeIcon, ContentCopyIcon, DeleteIcon, EditIcon, FileCopyIcon } from "@bigcommerce/big-design-icons";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useDeleteProductTable, useDuplicateProductTable, useProductTables } from "../hooks/useProductTables";
import type { ProductTableInstance } from "../types";

export const ProductTablesPage = () => {
  const navigate = useNavigate();
  const [embedModalOpen, setEmbedModalOpen] = useState(false);
  const [tableTypeModalOpen, setTableTypeModalOpen] = useState(false);
  const [selectedProductTable, setSelectedProductTable] = useState<ProductTableInstance | null>(null);

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
        alert("Failed to delete product table");
      }
    }
  };

  const handleDuplicate = async (productTable: ProductTableInstance) => {
    try {
      const newProductTable = await duplicateProductTable.mutateAsync(productTable);
      if (newProductTable) {
        navigate(`/product-tables/${newProductTable.id}/edit`);
      }
    } catch (error) {
      alert("Failed to duplicate product table");
    }
  };

  const handleShowEmbed = (productTable: ProductTableInstance) => {
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
  const productTableData: ProductTableInstance[] = Array.isArray(productTables) ? productTables : [];

  return (
    <Box>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="medium" >
        <H1 marginBottom="none">Product Tables</H1>
        <Button
          variant="secondary"
          iconLeft={<AddIcon />}
          onClick={() => setTableTypeModalOpen(true)}
        >
          Create New Product Table
        </Button>
      </Flex>

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
              onClick={() => setTableTypeModalOpen(true)}
            >
              Create Product Table
            </Button>
          </Flex>
        </Panel>
      ) : (
        <Panel>
          <Box>
            {productTableData.map((productTable: ProductTableInstance) => (
              <Flex
                key={productTable.id}
                justifyContent="space-between"
                alignItems="center"
                borderBottom="box"
                marginBottom="small"
              >
                <Box>
                  <Flex alignContent="center" flexGap="small">
                    <Text marginBottom="none" marginRight="xSmall" bold>{productTable.productTableName || "Unnamed Product Table"}</Text>
                    <Badge
                      label={productTable.placementLocation || "Not Set"}
                      variant={productTable.placementLocation ? "secondary" : "warning"}
                      marginRight="xSmall"
                    />
                    <Badge
                      label={productTable.isActive ? "Active" : "Inactive"}
                      variant={productTable.isActive ? "success" : "secondary"}
                      marginRight="small"
                    />
                  </Flex>
                  <Flex alignItems="center" marginBottom="xSmall">
                    <Text color="secondary60" marginRight="xSmall" margin="none">
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
                <Flex alignItems="center" flexGap="xSmall">
                  <Button
                    iconOnly={<CodeIcon />}
                    variant="secondary"
                    onClick={() => handleShowEmbed(productTable)}
                    aria-label="Show Embed Code"
                  />

                  <Button
                    iconOnly={<EditIcon />}
                    variant="primary"
                    onClick={() => navigate(`/product-tables/${productTable.id}/edit`)}
                    aria-label="Edit"
                  />

                  <Button
                    iconOnly={<ContentCopyIcon />}
                    variant="secondary"
                    onClick={() => handleDuplicate(productTable)}
                    isLoading={duplicateProductTable.isPending}
                    aria-label="Duplicate Product Table"
                  />

                  <Button
                    iconOnly={<DeleteIcon />}
                    variant="subtle"
                    actionType="destructive"
                    onClick={() => handleDelete(productTable.id, productTable.productTableName || "Unnamed Product Table")}
                    isLoading={deleteProductTable.isPending}
                    aria-label="Delete"
                  />
                </Flex>
              </Flex>
            ))}
          </Box>
        </Panel >
      )}

      <Box marginTop="medium">
        <Text color="secondary60">
          Total product tables: {productTableData.length}
        </Text>
      </Box>

      {/* Table Type Selection Modal */}
      <Modal
        isOpen={tableTypeModalOpen}
        onClose={() => setTableTypeModalOpen(false)}
        header="Select Table Type"
        closeOnClickOutside={false}
        closeOnEscKey={true}
      >
        <Box>
          <Text marginBottom="medium">
            Choose the type of product table you want to create:
          </Text>

          <Box
            border="box"
            borderRadius="normal"
            padding="medium"
            marginBottom="medium"
            style={{ cursor: "pointer" }}
            backgroundColor="white"
            onClick={() => {
              setTableTypeModalOpen(false);
              navigate("/product-tables/new?type=normal");
            }}
          >
            <Text bold marginBottom="xSmall">Normal Product Table</Text>
            <Text color="secondary60">
              Display products from your catalog on Home Page, Category Pages, or Custom Pages.
              Choose from all products or specific categories.
            </Text>
          </Box>

          <Box
            border="box"
            borderRadius="normal"
            padding="medium"
            style={{ cursor: "pointer" }}
            backgroundColor="white"
            onClick={() => {
              setTableTypeModalOpen(false);
              navigate("/product-tables/new?type=variant");
            }}
          >
            <Text bold marginBottom="xSmall">Variant Table (PDP Only)</Text>
            <Text color="secondary60">
              Display all variants of a single product in table format on Product Detail Pages.
              Perfect for products with multiple sizes, colors, or options.
            </Text>
          </Box>

          <Flex justifyContent="flex-end" marginTop="medium" marginBottom="medium">
            <Button
              variant="subtle"
              onClick={() => setTableTypeModalOpen(false)}
            >
              Cancel
            </Button>
          </Flex>
        </Box>
      </Modal>

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
    </Box >
  );
};
