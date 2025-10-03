# Product Table Widget Setup Guide

## Overview

This guide explains how to create and add Product Table Widgets to your BigCommerce storefront.

## How It Works

1. **Create widgets in Gadget Admin** - Configure columns, targeting, display settings
2. **Get Widget ID** - Copy the unique Widget ID from the admin panel
3. **Add to Page Builder** - Paste the Widget ID in BigCommerce Page Builder
4. **Widget loads dynamically** - The widget fetches its configuration from the database and renders

---

## Step-by-Step Instructions

### Step 1: Create a Widget in Gadget Admin

1. Open your Gadget app in the BigCommerce admin panel
2. Navigate to **"Product Table Widgets"**
3. Click **"Create New Widget"**
4. Configure your widget:
   - **Widget Name**: Give it a descriptive name (e.g., "Homepage Featured Products")
   - **Display Format**: Choose table, grid, or grouped view
   - **Columns**: Select which columns to display (SKU, Name, Price, Stock, etc.)
   - **Product Source**: All products, specific collections, or current category
   - **Customer Targeting**: Who should see this widget (all, retail, wholesale, etc.)
   - **View Options**: Default view mode, enable view switching, sorting
5. Click **"Save Widget"**
6. Note the **Widget ID** (e.g., `widget-abc123`)

### Step 2: Copy Widget ID

From the widgets list page:

1. Find your widget in the list
2. Click the **copy button (📋)** next to the Widget ID
3. The Widget ID will be copied to your clipboard
4. You'll see a confirmation: "Widget ID copied: widget-abc123"

### Step 3: Add Widget to BigCommerce Storefront

#### Method 1: Using Page Builder (Recommended)

1. In BigCommerce admin, go to **Storefront > Web Pages** (or Products/Categories)
2. Edit the page where you want the widget
3. Open **Page Builder**
4. Find **"Product Table Widget"** in the widgets panel
5. Drag it to your desired location
6. In the widget settings:
   - Paste the **Widget ID** you copied
   - (Optional) Override display settings
7. Save and publish the page

#### Method 2: Using Theme Files (Advanced)

If your theme doesn't support Page Builder, add this code to your template:

```html
<!-- Container for widget -->
<div id="product-table-{{WIDGET_ID}}" data-product-table-widget="{{WIDGET_ID}}"></div>

<!-- Load widget script -->
<script src="https://your-app.gadget.app/widget-loader.js"></script>
```

Replace `{{WIDGET_ID}}` with your actual Widget ID (e.g., `widget-abc123`).

---

## Widget Configuration Options

### Display Formats

- **Table View**: Traditional table layout with sortable columns
- **Grid View**: Card-based grid layout
- **Folded View**: Collapsed products with expand option
- **Grouped by Variants**: Products grouped by parent product
- **Grouped by Category**: Products organized by category
- **Grouped by Collection**: Products organized by collection

### Available Columns

- Product Image
- SKU
- Product Name
- Price (with customer-group-specific pricing)
- Stock Status
- Add to Cart Button
- Description
- Category
- Brand
- Weight

### Customer Targeting Options

- **All Customers**: Show to everyone (default)
- **Retail Only**: Show only to retail customers
- **Wholesale Only**: Show only to wholesale customers
- **Logged-in Only**: Require login to view
- **Custom Tags**: Target customers with specific tags

### Features

- **Search Filter**: Debounced search across products
- **View Switcher**: Toggle between table and grid views
- **Sorting**: Sort by name, price, SKU, newest, oldest
- **Pagination**: Navigate large product lists
- **Customer-Specific Pricing**: Automatic price adjustments based on customer group

---

## Troubleshooting

### Widget Not Showing

**Check:**

1. Widget ID is correct and copied accurately
2. Widget is marked as "Active" in Gadget admin
3. Widget targeting includes your customer group
4. Page Builder widget has the correct Widget ID pasted

**Browser Console:**

```javascript
// Check if widget loader detected the app URL
console.log('[Widget Loader] Set global __GADGET_API_URL__ to:', window.__GADGET_API_URL__);

// Check if config was fetched
// Look for: [Widget Loader] Fetched config: {...}
```

### Widget Shows "Loading..." Indefinitely

**Possible causes:**

1. CORS error - check browser console for CORS errors
2. Widget config not found - verify Widget ID exists in database
3. API endpoint not responding - check network tab for failed requests

**Fix:**

- Verify the Widget ID is correct
- Check that the Gadget app URL is accessible
- Ensure widget config API endpoint is working: `/api/widgets/{widgetId}`

### No Products Showing

**Check:**

1. Product source settings (are products in the selected collection/category?)
2. Product availability (are products in stock and published?)
3. Customer permissions (does the customer have access to these products?)

### Styling Doesn't Match Theme

The widget uses BigCommerce CSS custom properties and should automatically inherit theme styles.

**If styles don't match:**

1. Verify theme supports CSS custom properties
2. Add custom CSS in the "Advanced" tab of widget settings
3. Check browser inspector for missing CSS variables

### Widget Settings Not Updating

**After changing widget settings:**

1. Rebuild the widget: `npm run build:widget`
2. Increment version in `api/routes/GET-widget-loader.js.ts`
3. Clear browser cache
4. Reload the storefront page

---

## Advanced Configuration

### Custom CSS

You can add custom styles in the widget's "Advanced" tab:

```css
/* Custom widget styles */
.product-table {
  max-width: 1200px;
  margin: 0 auto;
}

.product-table th {
  background-color: #f0f0f0;
}

.product-table .price {
  color: #e74c3c;
  font-weight: bold;
}
```

### Multiple Widgets on Same Page

You can add multiple widgets to the same page:

```html
<!-- Widget 1: Featured Products -->
<div data-product-table-widget="widget-featured"></div>

<!-- Widget 2: Related Products -->
<div data-product-table-widget="widget-related"></div>

<!-- Single script tag loads both -->
<script src="https://your-app.gadget.app/widget-loader.js"></script>
```

Each widget will load its own configuration from the database.

---

## API Endpoints

The widget system uses these API endpoints:

- `GET /api/products` - Fetch products from BigCommerce
- `GET /api/customer-context` - Get customer group and pricing context
- `GET /api/widgets/{widgetId}` - Fetch widget configuration
- `GET /widget-loader.js` - Serve widget JavaScript bundle

All endpoints support CORS for cross-origin requests from the storefront.

---

## Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Check Gadget logs in the admin panel
4. Verify widget configuration in Gadget admin UI

---

## Technical Details

### Widget Loading Flow

1. Page loads with `<div data-product-table-widget="widget-123">`
2. Widget loader script detects the div
3. Extracts Gadget app URL from script tag
4. Fetches widget config: `GET /api/widgets/widget-123`
5. Renders ProductTable component with fetched config
6. Widget inherits BigCommerce theme styling automatically

### Theme Integration

The widget uses CSS custom properties:

- Colors: `--color-primary`, `--color-textBase`, etc.
- Typography: `--fontFamily-sans`, `--fontSize-*`
- Spacing: `--spacing-xs/sm/md/lg`
- Buttons: `--button-primary-backgroundColor`

This ensures the widget matches any BigCommerce theme automatically.

### Caching

- Widget config: Fetched per page load (no cache)
- Products: Cached for 5 minutes with TanStack Query
- Widget bundle: Cached for 24 hours with ETag validation
