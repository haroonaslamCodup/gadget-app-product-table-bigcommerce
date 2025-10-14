// Type declarations for Gadget-specific globals and modules

declare module '@gadget-client/extend-commerce-product-table-test' {
  interface ClientOptions {
    environment?: string;
  }

  export class Client {
    constructor(options?: ClientOptions);

    // Connection methods required by AnyClient
    connection: any;
    query: (...args: any[]) => Promise<any>;
    mutate: (...args: any[]) => Promise<any>;
    transaction: (...args: any[]) => Promise<any>;

    // Model accessors
    bigcommerce: {
      store: any;
    };
    widgetInstance: any;
    productTable: any;
    session: any;
    internal: {
      bigcommerce: any;
      widgetInstance: any;
      productTable: any;
      session: any;
    };
  }

  export default Client;
}

declare global {
  interface Window {
    gadgetConfig: {
      environment: string;
      apiUrl?: string;
    };
    BCData?: any;
    __GADGET_API_URL__?: string;
    __productTableWidgets?: any;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: string;
      GADGET_PUBLIC_APP_ENV?: string;
    }
  }
}

export {};
