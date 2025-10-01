import type { RouteContext } from "gadget-server";

/**
 * GET /storefront/widget.html
 *
 * Hosts the widget runtime on the Gadget domain so we can use Vite/module imports safely.
 * Accepts a base64-encoded JSON `config` query param that is parsed in-page.
 */
export default async function route({ request, reply }: RouteContext) {
    const url = new URL(request.url, "http://local");
    const configParam = url.searchParams.get("config") || "";

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Product Table Widget</title>
    <style>html,body,#root{height:100%;margin:0;padding:0;background:transparent}</style>
  </head>
  <body>
    <div id="root"></div>
    <script>window.__WIDGET_CONFIG_B64__ = ${JSON.stringify(configParam)};</script>
    <script type="module">
      // Bridge: decode config and attach to window before loading runtime
      try {
        const raw = window.__WIDGET_CONFIG_B64__ || "";
        const json = raw ? JSON.parse(atob(raw)) : {};
        window.__ProductTableWidgetConfig__ = json;
      } catch (e) {
        console.error('Failed to parse widget config', e);
        window.__ProductTableWidgetConfig__ = {};
      }
      import '/web/storefront/widget-loader.tsx';
    </script>
  </body>
</html>`;

    reply
        .type("text/html; charset=utf-8")
        .header("Cache-Control", "public, max-age=60")
        .send(html);
}


