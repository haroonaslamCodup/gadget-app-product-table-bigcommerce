import type { RouteContext } from "gadget-server";

/**
 * Route: GET /api/version-check
 *
 * Compares widget instance version with latest available version
 * Returns update availability and changelog information
 *
 * Query params:
 * - widgetId: Widget instance ID
 * - currentVersion: Current version of the widget
 */

export default async function route({ request, reply, api, logger }: RouteContext) {
  try {
    // Use request.query instead of parsing URL (Fastify provides parsed query params)
    const params = request.query as Record<string, string>;

    const widgetId = params.widgetId;
    const currentVersion = params.currentVersion || "0.0.0";

    logger.info(`Checking widget version: widgetId=${widgetId}, currentVersion=${currentVersion}`);

    // Define the latest version (this would typically come from a config or database)
    const LATEST_VERSION = "1.0.0";
    const CHANGELOG = {
      "1.0.0": [
        "Initial release",
        "Product table widget with customer group pricing",
        "Multi-location placement support",
        "Customizable columns and display formats"
      ]
    };

    // Compare versions
    const updateAvailable = compareVersions(currentVersion, LATEST_VERSION) < 0;

    const versionInfo = {
      widgetId,
      currentVersion,
      latestVersion: LATEST_VERSION,
      updateAvailable,
      changelog: CHANGELOG[LATEST_VERSION] || [],
      releaseDate: "2025-01-01", // TODO: Get from database
      breakingChanges: false,
      requiredUpdate: false,
    };

    // If widget ID is provided, update lastChecked timestamp
    if (widgetId) {
      try {
        const widget = await api.widgetInstance.findFirst({
          filter: { widgetId: { equals: widgetId } }
        });

        if (widget) {
          await api.widgetInstance.update(widget.id, {
            lastChecked: new Date(),
          });
        }
      } catch (updateError: unknown) {
        const err = updateError as Error;
        logger.warn(`Failed to update lastChecked timestamp: widgetId=${widgetId}, error=${err.message}`);
      }
    }

    logger.info(`Version check completed: ${JSON.stringify(versionInfo)}`);

    return reply
      .code(200)
      .header("Content-Type", "application/json")
      .header("Cache-Control", "public, max-age=3600") // Cache for 1 hour
      .send(versionInfo);

  } catch (error: unknown) {
    const err = error as Error;
    logger.error(`Error checking version: ${err.message}, stack=${err.stack}`);
    return reply.code(500).send({ error: "Internal server error" });
  }
}

/**
 * Compare two semantic versions
 * Returns: -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const part1 = parts1[i] || 0;
    const part2 = parts2[i] || 0;

    if (part1 < part2) return -1;
    if (part1 > part2) return 1;
  }

  return 0;
}
