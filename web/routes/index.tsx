import { useNavigate } from "react-router";
import { Box, Button, Panel, Text, Flex, H1, H2, Link } from "@bigcommerce/big-design";
import { CheckIcon, StoreIcon, AddIcon } from '@bigcommerce/big-design-icons';
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { useWidgets } from "../hooks/useWidgets";

export const IndexPage = () => {
  const navigate = useNavigate();

  const { data: store } = useQuery({
    queryKey: ["store"],
    queryFn: () => api.bigcommerce.store.findFirst(),
  });

  const { data: widgets } = useWidgets(store?.id);

  return (
    <>
      <Flex justifyContent="space-between" alignItems="center" marginBottom="large">
        <H1>Product Table Widget</H1>
        <Button
          iconLeft={<AddIcon />}
          onClick={() => navigate("/widgets/new")}
        >
          Create Widget
        </Button>
      </Flex>

      <Panel
        header="Welcome!"
        marginBottom="medium"
      >
        <Flex flexDirection="column" gap="medium">
          <Flex gap="small" alignItems="center">
            <CheckIcon color="success" />
            <Text>Successfully connected to BigCommerce</Text>
          </Flex>

          <Box>
            <H2 marginBottom="small">Quick Start Guide</H2>
            <Text>
              This app allows you to create customizable product table widgets that can be placed on your store's homepage, product pages, or category pages.
            </Text>
          </Box>

          <Box>
            <Text bold marginBottom="xSmall">Features:</Text>
            <ul style={{ marginTop: 0, paddingLeft: "20px" }}>
              <li>Customer group-specific pricing (retail, wholesale, etc.)</li>
              <li>Customizable columns and display formats</li>
              <li>Drag-and-drop column ordering</li>
              <li>Product filtering by collections or categories</li>
              <li>Customer targeting options</li>
              <li>Multiple placement locations</li>
            </ul>
          </Box>

          <Flex gap="medium">
            <Button onClick={() => navigate("/widgets/new")}>
              Create Your First Widget
            </Button>
            <Button variant="subtle" onClick={() => navigate("/widgets")}>
              View All Widgets
            </Button>
          </Flex>
        </Flex>
      </Panel>

      <Panel
        header="Store Information"
        marginBottom="medium"
      >
        <Box border="box" padding="medium">
          <Flex gap="medium" flexDirection="column">
            <Flex gap="small" alignItems="center">
              <StoreIcon color="secondary60" />
              <Text color="secondary60">
                {store?.storeHash ? `store-${store.storeHash}.mybigcommerce.com` : "Loading..."}
              </Text>
            </Flex>

            <Box>
              <Text bold>Widgets Created:</Text>
              <Text>{widgets?.length || 0}</Text>
            </Box>

            <Box>
              <Text bold>App Version:</Text>
              <Text>1.0.0</Text>
            </Box>
          </Flex>
        </Box>
      </Panel>

      <Panel header="Next Steps">
        <Flex flexDirection="column" gap="small">
          <Text>
            1. <Link onClick={() => navigate("/widgets/new")}>Create a new widget</Link> with your desired configuration
          </Text>
          <Text>
            2. Configure display format, columns, and customer targeting
          </Text>
          <Text>
            3. Use BigCommerce Page Builder to place your widget on any page
          </Text>
          <Text>
            4. Customers will see personalized pricing based on their group
          </Text>
        </Flex>
      </Panel>
    </>
  );
};
