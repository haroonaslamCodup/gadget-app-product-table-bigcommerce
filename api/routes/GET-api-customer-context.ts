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

export default async function route({ request, reply, api, logger, connections }: RouteContext) {
  try {
    const url = new URL(request.url);
    const params = url.searchParams;

    const customerId = params.get("customerId");

    logger.info("Fetching customer context", { customerId });

    let customerContext = {
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
    if (customerId) {
      try {
        const customerResponse = await connections.bigcommerce.get(`/v3/customers?id:in=${customerId}`);

        if (customerResponse && customerResponse.data && customerResponse.data.data && customerResponse.data.data.length > 0) {
          const customer = customerResponse.data.data[0];

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
          if (customer.customer_group_id) {
            try {
              const groupResponse = await connections.bigcommerce.get(
                `/v2/customer_groups/${customer.customer_group_id}`
              );

              if (groupResponse && groupResponse.data) {
                const groupName = groupResponse.data.name.toLowerCase();
                customerContext.customerGroup = groupName;
                customerContext.isWholesale = groupName.includes("wholesale") || groupName.includes("b2b");
              }
            } catch (groupError) {
              logger.warn("Failed to fetch customer group details", {
                customerGroupId: customer.customer_group_id,
                error: groupError.message
              });
            }
          }
        }
      } catch (customerError) {
        logger.warn("Failed to fetch customer details", {
          customerId,
          error: customerError.message
        });
      }
    }

    logger.info("Customer context fetched successfully", { context: customerContext });

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "private, no-cache") // Don't cache customer data
      .send(customerContext);

  } catch (error) {
    logger.error("Error fetching customer context", { error: error.message, stack: error.stack });
    return reply.code(500).send({ error: "Internal server error" });
  }
}
