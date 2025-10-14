/// <reference path="./types/gadget.d.ts" />
// Sets up the API client for interacting with your backend.
// For your API reference, visit: https://docs.gadget.dev/api/extend-commerce-product-table-test
import { Client } from "@gadget-client/extend-commerce-product-table-test";

export const api = new Client({ environment: window.gadgetConfig.environment });