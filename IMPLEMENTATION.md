# Product Table Widget - Implementation Guide

## Overview

This BigCommerce app allows merchants to create customizable product table widgets with customer group-specific pricing. Built on Gadget with React, TanStack Query, and BigDesign components.

## Architecture

### Tech Stack
- **Framework**: Gadget v1.4.0 (serverless BigCommerce platform)
- **Frontend**: React 19.1.1 + React Router v7.6.2
- **State Management**: TanStack Query v5.90.2
- **UI Components**: BigCommerce BigDesign v1.1.0
- **Styling**: Styled Components v5.3.11
- **Build Tool**: Vite with SWC

### Project Structure

```
├── api/
│   ├── models/
│   │   └── widgetInstance/
│   │       ├── schema.gadget.ts          # Widget data model
│   │       └── actions/
│   │           ├── create.ts             # Create widget
│   │           ├── update.ts             # Update widget
│   │           └── delete.ts             # Delete widget
│   └── routes/
│       ├── GET-api-products.ts           # Product fetching with pricing
│       ├── GET-api-pricing.ts            # Customer-specific pricing
│       ├── GET-api-collections.ts        # Collections/categories
│       ├── GET-api-customer-context.ts   # Customer context
│       ├── GET-api-widgets-list.ts       # Active widgets list
│       └── GET-api-widgets-[widgetId].ts # Widget configuration
├── web/
│   ├── components/
│   │   ├── widgets/
│   │   │   ├── WidgetForm.tsx            # Create/Edit widget form
│   │   │   ├── ColumnManager.tsx         # Drag-drop column ordering
│   │   │   └── CollectionSelector.tsx    # Product source selector
│   │   ├── storefront/
│   │   │   ├── ProductTable.tsx          # Main widget component
│   │   │   ├── ProductTableHeader.tsx    # Table header with sorting
│   │   │   ├── ProductTableRow.tsx       # Product row (table/grid)
│   │   │   ├── ProductImage.tsx          # Product image
│   │   │   ├── ProductPrice.tsx          # Price with customer group
│   │   │   ├── ProductStock.tsx          # Stock indicator
│   │   │   ├── AddToCartButton.tsx       # Add to cart
│   │   │   ├── Pagination.tsx            # Pagination controls
│   │   │   ├── GroupedView.tsx           # Grouped/folded display
│   │   │   ├── ViewSwitcher.tsx          # Table/Grid toggle
│   │   │   └── SearchFilter.tsx          # Product search
│   │   ├── App.tsx                       # Root component with routing
│   │   ├── Navigation.tsx                # Tab navigation
│   │   └── ErrorBoundary.tsx             # Error handling
│   ├── routes/
│   │   ├── index.tsx                     # Dashboard
│   │   ├── widgets.tsx                   # Widgets list
│   │   ├── widget-new.tsx                # Create widget
│   │   └── widget-edit.tsx               # Edit widget
│   ├── hooks/
│   │   ├── useWidgets.ts                 # Widget CRUD hooks
│   │   ├── useProducts.ts                # Product data hooks
│   │   └── useCustomer.ts                # Customer context hooks
│   └── storefront/
│       ├── widget-loader.ts              # Page Builder loader script
│       └── widget-config.json            # Page Builder widget config
├── accessControl/
│   ├── permissions.gadget.ts             # Role-based permissions
│   └── filters/
│       └── widgetInstance.gelly          # Widget access filter
└── CLAUDE.md                              # Project documentation
```

## Features Implemented

### 1. Admin Control Panel

#### Dashboard (`/`)
- Welcome message with app status
- Quick start guide
- Store information
- Widget count
- Feature overview

#### Widgets List (`/widgets`)
- Table view of all widgets
- Edit, delete, duplicate actions
- Widget status indicators
- Empty state with CTA

#### Widget Creation/Editing (`/widgets/new`, `/widgets/:id/edit`)
- **Basic Information**: Widget name, placement location
- **Display Settings**: Format (folded, grouped), columns selection
- **Product Source**: All collections, specific collections, current category
- **Customer Targeting**: All customers, retail only, wholesale only, customer tags, logged-in only
- **View Options**: Allow view switching, default view, enable sorting
- **Sorting & Pagination**: Default sort order, items per page
- **Status**: Active/inactive toggle, internal notes

#### Column Management
- Drag-and-drop column reordering
- Enable/disable columns with checkboxes
- Visual position indicators
- Available columns: image, SKU, name, price, stock, add to cart, description, category, brand, weight

### 2. Storefront Widget

#### Display Modes
- **Table View**: Traditional table with sortable columns
- **Grid View**: Card-based grid layout
- **Grouped by Variants**: Products grouped with expandable variants
- **Grouped by Category**: Products organized by category
- **Grouped by Collection**: Products organized by collection

#### Product Features
- **Images**: Responsive with lazy loading, placeholder for missing images
- **Pricing**: Customer group-specific pricing with sale price display
- **Stock**: Visual indicators (in stock, low stock, out of stock)
- **Add to Cart**: Quantity selector with loading states
- **Search**: Debounced search with clear button
- **Pagination**: Smart pagination with ellipsis
- **Sorting**: Name, price (asc/desc), SKU, newest, oldest

#### Customer Targeting
- Widget visibility based on customer group
- Retail vs wholesale targeting
- Customer tag filtering
- Logged-in only option
- Server-side pricing by customer group

### 3. Data Layer

#### Models
- **widgetInstance**: Complete widget configuration with 33 fields
- **bigcommerce/store**: Store connection (Gadget managed)

#### API Routes
- `GET /api/products` - Products with filtering, pagination, pricing
- `GET /api/pricing` - Customer-specific pricing
- `GET /api/collections` - Collections/categories list
- `GET /api/customer-context` - Current customer context
- `GET /api/widgets/list` - Active widgets for Page Builder
- `GET /api/widgets/:widgetId` - Widget configuration for storefront

#### Permissions
- `bigcommerce-app-users` role has full CRUD access to widgets
- Gelly filter restricts access to store's own widgets
- Public access to storefront widget endpoints

### 4. State Management

#### TanStack Query Integration
- Optimistic updates for mutations
- Automatic cache invalidation
- Hierarchical query keys
- 5-minute stale time for queries
- React Query DevTools in development

#### Query Keys Strategy
```typescript
["widgets", storeId]              // All widgets for store
["widget", widgetId]              // Single widget
["products", filters]             // Products with filters
["pricing", productId, groupId]   // Product pricing
["collections", storeId]          // Collections list
["customer-context"]              // Customer context
```

## Usage Guide

### For Merchants

#### Creating a Widget

1. Navigate to the app in BigCommerce control panel
2. Click "Create Widget" button
3. Fill in widget configuration:
   - Name your widget
   - Choose placement location (homepage, PDP, category, custom)
   - Select display format
   - Configure which columns to show and their order
   - Choose product source (all, specific collections, current category)
   - Set customer targeting rules
   - Configure view and sorting options
4. Click "Save Widget"

#### Adding Widget to Storefront

1. Go to BigCommerce > Storefront > Page Builder
2. Edit the page where you want the widget
3. Add "Product Table Widget" from widget panel
4. Select your widget from dropdown
5. Configure display options
6. Publish the page

#### Managing Widgets

- **Edit**: Click widget name or edit icon in widgets list
- **Duplicate**: Click duplicate icon to copy configuration
- **Delete**: Click delete icon (with confirmation)
- **Activate/Deactivate**: Toggle status in widget form

### For Developers

#### Local Development

```bash
# Install dependencies
yarn install

# Start development server
gadget dev

# Build for production
yarn build
```

#### Adding New Columns

1. Update `schema.gadget.ts` if new data needed
2. Add column label to `ProductTableHeader.tsx`
3. Add column rendering to `ProductTableRow.tsx`
4. Update column options in `WidgetForm.tsx`

#### Custom Styling

Add custom CSS in Page Builder widget settings or modify styled components in `/web/components/storefront/`.

#### API Integration

Products are fetched server-side with pricing applied based on customer group:

```typescript
// In storefront component
const { data } = useProducts({
  collection: "summer-sale",
  userGroup: customerContext?.customerGroupId,
  page: 1,
  limit: 25,
  sort: "price-asc"
});
```

#### Error Handling

All components wrapped in `ErrorBoundary`:
- Catches React errors
- Shows user-friendly message
- Displays stack trace in development
- Provides reset/refresh options

## Configuration

### Environment Variables
- `GADGET_PUBLIC_APP_ENV` - App environment (development/production)
- BigCommerce credentials managed by Gadget

### Default Settings
- Items per page: 25
- Stale time: 5 minutes
- Cache time: 30 minutes
- Default columns: image, SKU, name, price, stock, add to cart

## Security

### Access Control
- Store-scoped widget access via Gelly filters
- Role-based permissions for bigcommerce-app-users
- Server-side pricing to prevent client manipulation
- No customer data exposure in public endpoints

### Rate Limiting
- Caching reduces API calls
- Debounced search (300ms)
- Pagination limits (max 250 items)

## Performance Optimizations

- Lazy loading for images
- React Query caching
- Optimistic updates for instant feedback
- Debounced search
- Code splitting with React Router
- Memoized computed values

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile responsive
- Touch-friendly controls
- Accessible (ARIA labels)

## Troubleshooting

### Widget Not Showing
1. Check widget is Active in admin
2. Verify customer targeting rules
3. Check Page Builder configuration
4. Verify widget ID matches

### Products Not Loading
1. Check Collections API connection
2. Verify product source configuration
3. Check browser console for errors
4. Verify customer group pricing setup

### Permission Errors
1. Verify bigcommerce-app-users role has access
2. Check Gelly filter configuration
3. Ensure user is authenticated

## Next Steps

### Recommended Enhancements
- [ ] Add CSV export for products
- [ ] Implement bulk actions
- [ ] Add widget analytics
- [ ] Create widget templates
- [ ] Add A/B testing support
- [ ] Implement custom fields
- [ ] Add multi-language support
- [ ] Create mobile app version

### Known Limitations
- Max 250 products per page
- Single store per session
- Client-side filtering limited
- No real-time inventory updates

## Support

For issues or questions:
1. Check error logs in Gadget dashboard
2. Review browser console errors
3. Verify BigCommerce API status
4. Contact support with widget ID and error details

## License

Proprietary - BigCommerce App
