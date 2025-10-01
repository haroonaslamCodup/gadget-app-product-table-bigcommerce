# Quick Start Guide: Using Widgets in Page Builder

## 📍 You Are Here
Your widget is created in the admin panel, but you're not seeing it in BigCommerce Page Builder yet.

## ✅ Complete These Steps

### Step 1: Get Your Widget ID
1. Go to **"Widgets"** tab in your app
2. Find your created widget
3. Copy the **Widget ID** (looks like: `widget-1759330856855-hqlbdgy`)

### Step 2: Add Widget Using HTML Widget (Manual Method)

Since the Widget Templates API may not be available on all BigCommerce plans, use this simple HTML method:

#### Add to Page Builder:
1. Go to BigCommerce Admin → **Storefront** → **My Themes**
2. Click **Customize** on your active theme
3. Navigate to any page (Home, Category, Product, or Custom)
4. Click **"Add Widget"** or drag a widget zone
5. Select **"HTML"** widget from the dropdown
6. **Paste this code** (replace YOUR_WIDGET_ID with your actual Widget ID):

```html
<div
  id="product-table-YOUR_WIDGET_ID"
  class="product-table-widget"
  data-product-table-widget='{"widgetId":"YOUR_WIDGET_ID"}'>
  <div class="loading">Loading products...</div>
</div>
```

7. Click **Save** and **Publish**

### Step 3: Add Widget Script to Your Theme

The widget needs JavaScript to work. Add this script **once** to your theme:

#### Option A: Using Script Manager (Recommended)
1. Go to **Storefront** → **Script Manager**
2. Click **Create a Script**
3. Fill in:
   - **Name**: Product Table Widget Loader
   - **Location**: Footer
   - **Script type**: Script URL
   - **Script URL**: `https://your-app.gadget.app/widget-loader.js`
   - **Load method**: Defer
   - **Pages**: All pages
4. Click **Save**

#### Option B: Edit Theme Files
1. Go to **Storefront** → **Themes** → Advanced → **Edit Theme Files**
2. Open `templates/layout/base.html`
3. Add before `</body>`:
```html
<script src="https://your-app.gadget.app/widget-loader.js" defer></script>
```
4. **Save** and **Apply**

> **Note**: Replace `your-app.gadget.app` with your actual Gadget app URL (found in Setup tab)

---

## 🎯 What You'll See

### In Admin Setup Page:
```
✓ Step 1: Install Widget Template
✓ Step 2: Install Widget Script
```

### In Page Builder Widgets List:
```
📦 Product Table Widget
   ├─ Widget ID: [Enter your widget ID here]
   ├─ Show Search Filter: ☑
   └─ Show View Switcher: ☑
```

### On Your Storefront:
Your product table with:
- Customer-specific pricing
- Configured columns
- Search/filter options
- Add to cart buttons

---

## ⚠️ Troubleshooting

### "Widget not showing in Page Builder dropdown"
**Solution**:
1. Go to Setup tab and click "Install Widget Template" again
2. Wait 1-2 minutes and refresh Page Builder
3. Clear your browser cache

### "Widget shows but doesn't load products"
**Solution**:
1. Check that Widget ID is correct (no typos)
2. Verify widget is marked as **Active** in admin
3. Make sure "Install Widget Script" was clicked in Setup
4. Check browser console for errors (F12)

### "Wrong products showing"
**Check**:
- Widget's "Product Source" settings
- Customer group targeting rules
- Collection/category filters

### "Pricing not showing correctly"
**Check**:
- Customer is logged in (for custom pricing)
- Price lists configured in BigCommerce (B2B feature)
- Widget targeting includes current customer group

---

## 📝 Summary

**To use widgets in Page Builder:**

1. ✅ Run Setup → Install Both
2. ✅ Create widget in Widgets tab
3. ✅ Copy Widget ID
4. ✅ Add to Page Builder → Enter Widget ID
5. ✅ Publish

**That's it!** Your widget should now be live on your storefront.

---

## 💡 Pro Tips

- **Multiple widgets**: Create different widgets for different pages/purposes
- **Duplicate widgets**: Use the duplicate button to save time
- **Test first**: Try on a test page before adding to homepage
- **Mobile check**: Preview on mobile before publishing
- **Performance**: Limit items-per-page for better load times

---

## 🆘 Still Having Issues?

1. Check `TYPESCRIPT_GUIDELINES.md` for common errors
2. Review `PREVENTION_CHECKLIST.md` for setup verification
3. Check BigCommerce Script Manager (Settings → Setup → Script Manager)
4. Verify widget UUID in API logs

---

**Need more details?** Check the full `WIDGET_USAGE_GUIDE.md` (coming soon)
