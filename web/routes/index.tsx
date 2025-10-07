import { Box, Button, Flex, H1, H2, Message, Panel, Text } from "@bigcommerce/big-design";
import { CheckIcon, ErrorIcon, StoreIcon, WarningIcon } from '@bigcommerce/big-design-icons';
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { api } from "../api";
import { useProductTables } from "../hooks/useProductTables";

export const IndexPage = () => {
  const navigate = useNavigate();

  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["connection-status"],
    queryFn: () => fetch("/api/connection-status").then(res => res.json()),
    refetchInterval: 30000, // Check every 30 seconds
  });

  const { data: productTable } = useProductTables(store?.id);

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" >
        <H1>Product Table Widget</H1>
        <Flex>
          {connectionStatus && !connectionStatus.credentialsValid && (
            <Button
              variant="secondary"
              onClick={() => navigate("/setup")}
              marginRight="small"
            >
              Setup Required
            </Button>
          )}
        </Flex>
      </Flex>

      {/* Connection Status Alert */}
      {connectionStatus && !connectionStatus.credentialsValid && (
        <Message
          type="error"
          messages={[{
            text: connectionStatus.error || "BigCommerce connection is not working properly"
          }]}
          marginBottom="medium"
          actions={[{
            actionType: "normal",
            text: "Go to Setup",
            onClick: () => navigate("/setup")
          }]}
        />
      )}

      <Panel
        header="Welcome!"

      >
        <Flex flexDirection="column">
          <Flex alignItems="center" marginBottom="small">
            {connectionStatus?.credentialsValid ? (
              <>
                <CheckIcon color="success" />
                <Text marginLeft="xSmall">Successfully connected to BigCommerce</Text>
              </>
            ) : connectionStatus?.storeFound ? (
              <>
                <WarningIcon color="warning" />
                <Text marginLeft="xSmall">Connection needs to be refreshed</Text>
              </>
            ) : (
              <>
                <ErrorIcon color="danger" />
                <Text marginLeft="xSmall">BigCommerce connection not found</Text>
              </>
            )}
          </Flex>

          <Box>
            <H2 marginBottom="small">Quick Start Guide</H2>
            <Text>
              This app allows you to create customizable product table widgets that can be placed on your store's homepage, product pages, or category pages.
            </Text>
          </Box>

          <Box>
            <Text bold marginBottom="none" marginTop="small" >Features:</Text>
            <ul style={{ marginTop: 0, paddingLeft: "20px" }}>
              <li>Customer group-specific pricing (retail, wholesale, etc.)</li>
              <li>Customizable columns and display formats</li>
              <li>Drag-and-drop column ordering</li>
              <li>Product filtering by collections or categories</li>
              <li>Customer targeting options</li>
              <li>Multiple placement locations</li>
            </ul>
          </Box>
        </Flex>
      </Panel>

      <Panel
        header="Store Information"
        marginBottom="xLarge"
      >
        <Box border="box" padding="medium">
          <Flex flexDirection="column">
            <Flex alignItems="center" marginBottom="small">
              <StoreIcon color="secondary60" />
              <Text color="secondary60" marginLeft="xSmall">
                {store?.storeHash ? `store-${store.storeHash}.mybigcommerce.com` : "Loading..."}
              </Text>
            </Flex>

            <Flex flexGap={"large"} >
              <Text marginRight="small" bold>Product Table Created:</Text>
              <Text>{productTable?.length || 0}</Text>
            </Flex>

            <Flex flexGap={"medium"} >
              <Text marginRight="small" bold>App Version:</Text>
              <Text>1.0.44</Text>
            </Flex>
          </Flex>
        </Box>
      </Panel>
    </>
  );
};
