import type { RouteContext } from "gadget-server";

/**
 * GET /widget-loader.js
 *
 * Serves an ES module that initializes the storefront widget loader.
 * In dev, this imports the TSX module through Vite; in prod, Vite bundles it.
 */
export default async function route({ reply }: RouteContext) {
    reply.type("application/javascript").send([
        "// Classic entry that works with BigCommerce Script Manager (non-module)",
        "(function(){",
        "  if (window.__ProductTableWidgetLoaderInjected) return;",
        "  window.__ProductTableWidgetLoaderInjected = true;",
        "  try {",
        "    var s = document.createElement('script');",
        "    s.type = 'module';",
        "    s.src = '/web/storefront/widget-loader.tsx';",
        "    document.head.appendChild(s);",
        "  } catch (e) {",
        "    console.error('Failed to inject widget loader module', e);",
        "  }",
        "})();",
    ].join("\n"));
}


