import type { RouteContext } from "gadget-server";

/**
 * GET /widget-loader.js
 *
 * Serves an ES module that initializes the storefront widget loader.
 * In dev, this imports the TSX module through Vite; in prod, Vite bundles it.
 */
export default async function route({ reply }: RouteContext) {
    reply
        .type("application/javascript; charset=utf-8")
        .header("Access-Control-Allow-Origin", "*")
        .header("Cross-Origin-Resource-Policy", "cross-origin")
        .header("X-Content-Type-Options", "nosniff")
        .header("Cache-Control", "public, max-age=300")
        .send([
            "// Classic entry to inject an iframe hosting the widget runtime",
            "(function(){",
            "  if (window.__ProductTableWidgetLoaderInjected) return;",
            "  window.__ProductTableWidgetLoaderInjected = true;",
            "  function b64(str){try{return btoa(str)}catch(e){return ''}}",
            "  try {",
            "    var nodes = document.querySelectorAll('[data-product-table-widget]');",
            "    for (var i=0;i<nodes.length;i++){",
            "      var el = nodes[i];",
            "      var cfgRaw = el.getAttribute('data-product-table-widget') || '{}';",
            "      var cfgB64 = b64(cfgRaw);",
            "      var iframe = document.createElement('iframe');",
            "      iframe.src = '/storefront/widget.html?config=' + encodeURIComponent(cfgB64);",
            "      iframe.style.width = '100%';",
            "      iframe.style.border = '0';",
            "      iframe.setAttribute('loading','lazy');",
            "      // Replace the placeholder div with iframe",
            "      el.innerHTML = '';",
            "      el.appendChild(iframe);",
            "    }",
            "  } catch (e) {",
            "    console.error('Failed to bootstrap widget iframe', e);",
            "  }",
            "})();",
        ].join("\n"));
}


