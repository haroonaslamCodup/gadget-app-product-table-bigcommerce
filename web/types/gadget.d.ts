// Type declarations for Gadget-specific globals and modules

declare module '@gadget-client/extend-commerce-product-table-test' {
  export class Client {
    constructor(options?: { environment?: string });

    // Connection methods required by AnyClient
    connection: any;
    query: (...args: any[]) => Promise<any>;
    mutate: (...args: any[]) => Promise<any>;
    transaction: (...args: any[]) => Promise<any>;

    // Model accessors
    bigcommerce: any;
    widgetInstance: any;
    productTable: any;
    session: any;
    internal: any;
  }
}

declare global {
  interface Window {
    gadgetConfig: {
      environment: string;
      apiUrl: string;
    };
    BCData?: any;
    __GADGET_API_URL__?: string;
    __productTableWidgets?: any;
  }
}

export {};
