import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "widgetInstance" model, go to https://extend-commerce-product-table-test.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v1",
  storageKey: "WidgetInstance",
  fields: {
    allowViewSwitching: {
      type: "boolean",
      default: true,
      storageKey: "allowViewSwitching",
    },
    columns: { type: "json", storageKey: "columns" },
    columnsOrder: { type: "json", storageKey: "columnsOrder" },
    createdBy: { type: "string", storageKey: "createdBy" },
    defaultSort: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "name",
        "price-asc",
        "price-desc",
        "newest",
        "oldest",
        "sku",
      ],
      storageKey: "defaultSort",
    },
    defaultToTableView: {
      type: "boolean",
      default: false,
      storageKey: "defaultToTableView",
    },
    displayFormat: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "folded",
        "grouped-variants",
        "grouped-category",
        "grouped-collection",
      ],
      storageKey: "displayFormat",
    },
    enableCustomerSorting: {
      type: "boolean",
      default: true,
      storageKey: "enableCustomerSorting",
    },
    isActive: {
      type: "boolean",
      default: true,
      storageKey: "isActive",
    },
    itemsPerPage: {
      type: "number",
      default: 25,
      storageKey: "itemsPerPage",
    },
    lastChecked: {
      type: "dateTime",
      includeTime: true,
      storageKey: "lastChecked",
    },
    notes: { type: "string", storageKey: "notes" },
    pageBuilderId: { type: "string", storageKey: "pageBuilderId" },
    pageContext: { type: "json", storageKey: "pageContext" },
    placementLocation: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["homepage", "pdp", "category", "custom"],
      storageKey: "placementLocation",
    },
    productSource: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "all-collections",
        "specific-collections",
        "current-category",
      ],
      storageKey: "productSource",
    },
    selectedCategories: {
      type: "json",
      storageKey: "selectedCategories",
    },
    selectedCollections: {
      type: "json",
      storageKey: "selectedCollections",
    },
    store: {
      type: "belongsTo",
      parent: { model: "bigcommerce/store" },
      storageKey: "storeId",
    },
    targetAllCustomers: {
      type: "boolean",
      default: true,
      storageKey: "targetAllCustomers",
    },
    targetCustomerTags: {
      type: "json",
      storageKey: "targetCustomerTags",
    },
    targetLoggedInOnly: {
      type: "boolean",
      default: false,
      storageKey: "targetLoggedInOnly",
    },
    targetRetailOnly: {
      type: "boolean",
      default: false,
      storageKey: "targetRetailOnly",
    },
    targetWholesaleOnly: {
      type: "boolean",
      default: false,
      storageKey: "targetWholesaleOnly",
    },
    version: { type: "string", storageKey: "version" },
    widgetId: {
      type: "string",
      validations: { unique: true },
      storageKey: "widgetId",
    },
    widgetName: { type: "string", storageKey: "widgetName" },
  },
};
