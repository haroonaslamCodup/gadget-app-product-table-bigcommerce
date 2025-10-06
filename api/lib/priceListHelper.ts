/**
 * Price List Helper (Simplified - No Caching)
 * Fetches and applies price list data for customer groups
 */

/**
 * Fetch price list data for a customer group
 */
export async function getPriceListForGroup(
  userGroup: string,
  bigcommerceConnection: any,
  logger: any
): Promise<Map<number | string, any>> {
  const priceListRecords = new Map<number | string, any>();

  try {
    // Get price list assignments
    const assignmentsResponse = await bigcommerceConnection.v3.get(
      `/pricelists/assignments?customer_group_id:in=${userGroup}`
    ) as any;

    const assignments = Array.isArray(assignmentsResponse)
      ? assignmentsResponse
      : assignmentsResponse?.data || [];

    if (assignments.length === 0) {
      return priceListRecords;
    }

    const priceListId = assignments[0].price_list_id;

    // Fetch price records with pagination
    let allRecords: any[] = [];
    let currentPage = 1;
    let hasMore = true;

    while (hasMore && currentPage <= 5) {
      const recordsResponse = await bigcommerceConnection.v3.get(
        `/pricelists/${priceListId}/records?limit=250&page=${currentPage}`
      ) as any;

      const records = Array.isArray(recordsResponse)
        ? recordsResponse
        : recordsResponse?.data || [];

      allRecords = allRecords.concat(records);

      const meta = recordsResponse?.meta?.pagination;
      hasMore = meta && meta.current_page < meta.total_pages;
      currentPage++;
    }

    // Build lookup map
    allRecords.forEach((record: any) => {
      if (record.variant_id) {
        priceListRecords.set(record.variant_id, record);
      } else if (record.product_id) {
        priceListRecords.set(`product_${record.product_id}`, record);
      }
    });

  } catch (error) {
    logger.error(`Failed to fetch price list: ${(error as Error).message}`);
  }

  return priceListRecords;
}

/**
 * Apply price list pricing to a product and its variants
 */
export function applyPricing(
  product: any,
  priceListRecords: Map<number | string, any>
): any {
  const productPriceRecord = priceListRecords.get(`product_${product.id}`);

  // Apply product-level pricing
  if (productPriceRecord) {
    product.calculated_price = productPriceRecord.price;
    product.calculated_sale_price = productPriceRecord.sale_price || null;
  } else {
    // Set default calculated values if no price list
    product.calculated_price = product.price;
    product.calculated_sale_price = product.sale_price || null;
  }

  // Apply variant-level pricing
  if (product.variants && Array.isArray(product.variants)) {
    product.variants = product.variants.map((variant: any) => {
      const variantPriceRecord = priceListRecords.get(variant.id);

      let finalPrice: number;
      let finalSalePrice: number | null = null;

      if (variantPriceRecord) {
        // Variant-specific price list
        finalPrice = variantPriceRecord.price;
        finalSalePrice = variantPriceRecord.sale_price || null;
      } else if (productPriceRecord) {
        // Product-level price list
        finalPrice = productPriceRecord.price;
        finalSalePrice = productPriceRecord.sale_price || null;
      } else {
        // Base pricing
        finalPrice = (variant.price !== null && variant.price !== undefined && variant.price > 0)
          ? variant.price
          : product.price;
        finalSalePrice = (variant.sale_price !== null && variant.sale_price !== undefined && variant.sale_price > 0)
          ? variant.sale_price
          : product.sale_price;
      }

      return {
        ...variant,
        calculated_price: finalPrice,
        calculated_sale_price: finalSalePrice,
      };
    });
  }

  return product;
}
