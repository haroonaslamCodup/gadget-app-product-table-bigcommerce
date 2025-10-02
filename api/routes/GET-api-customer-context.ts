import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/customer-context
 *
 * Returns customer context information for determining pricing and visibility
 * Validates customer session and returns group, tags, logged-in status
 *
 * Query params:
 * - customerId: Customer ID from BigCommerce (optional, from session)
 */

export default async function route({ request, reply, logger, connections }: RouteContext) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return reply
      .code(204)
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "GET, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type")
      .send();
  }

  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const customerId = params.get("customerId");

    logger.info(`Fetching customer context: customerId=${customerId}`);

    let customerContext: {
      customerId: string | null;
      customerGroup: string;
      customerGroupId: number | null;
      customerTags: string[];
      isLoggedIn: boolean;
      isWholesale: boolean;
      email: string | null;
      name: string | null;
    } = {
      customerId: null,
      customerGroup: "guest",
      customerGroupId: null,
      customerTags: [],
      isLoggedIn: false,
      isWholesale: false,
      email: null,
      name: null,
    };

    // If customer ID is provided, fetch customer details
    if (customerId && connections.bigcommerce.current) {
      try {
        const customerResponse = await connections.bigcommerce.current.v3.get<any>(`/customers?id:in=${customerId}`);

        if (customerResponse && Array.isArray(customerResponse) && customerResponse.length > 0) {
          const customer = customerResponse[0];

          customerContext = {
            customerId: customer.id,
            customerGroup: customer.customer_group_id ? "retail" : "guest",
            customerGroupId: customer.customer_group_id,
            customerTags: customer.tags || [],
            isLoggedIn: true,
            isWholesale: customer.customer_group_id ? true : false, // TODO: Check if group is wholesale
            email: customer.email,
            name: `${customer.first_name} ${customer.last_name}`.trim(),
          };

          // If customer has a group ID, fetch group details
          if (customer.customer_group_id && connections.bigcommerce.current) {
            try {
              const groupResponse = await connections.bigcommerce.current.v2.get<any>(`/customer_groups/${customer.customer_group_id}`) as any;

              if (groupResponse && groupResponse.name) {
                const groupName = (groupResponse.name as string).toLowerCase();
                customerContext.customerGroup = groupName;
                customerContext.isWholesale = groupName.includes("wholesale") || groupName.includes("b2b");
              }
            } catch (groupError: unknown) {
              const err = groupError as Error;
              logger.warn(`Failed to fetch customer group details: customerGroupId=${customer.customer_group_id}, error=${err.message}`);
            }
          }
        }
      } catch (customerError: unknown) {
        const err = customerError as Error;
        logger.warn(`Failed to fetch customer details: customerId=${customerId}, error=${err.message}`);
      }
    }

    logger.info(`Customer context fetched successfully: ${JSON.stringify(customerContext)}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "private, no-cache") // Don't cache customer data
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Methods", "GET, OPTIONS")
      .header("Access-Control-Allow-Headers", "Content-Type")
      .send(customerContext);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error fetching customer context: ${err.message}, stack=${err.stack}`);
    return reply
      .code(500)
      .header("Access-Control-Allow-Origin", "*")
      .send({ error: "Internal server error" });
  }
}
