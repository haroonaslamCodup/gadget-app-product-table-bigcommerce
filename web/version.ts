// Auto-synced version from package.json
// This file provides a single source of truth for the app version

import packageJson from '../package.json';

export const APP_VERSION = packageJson.version;
export const APP_NAME = packageJson.name;
export const APP_DESCRIPTION = packageJson.description;

// Widget version (use this for widget script versioning)
export const WIDGET_VERSION = `v${packageJson.version}`;

// Version display helpers
export const getVersionInfo = () => ({
  version: APP_VERSION,
  name: APP_NAME,
  description: APP_DESCRIPTION,
  widgetVersion: WIDGET_VERSION,
  buildDate: new Date().toISOString(),
});

// Log version on app load (useful for debugging)
if (typeof window !== 'undefined') {
  console.log(`🚀 ${APP_NAME} v${APP_VERSION}`);
}
