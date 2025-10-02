/**
 * BigCommerce Theme Variables
 *
 * This file contains CSS custom properties (variables) that BigCommerce themes commonly use.
 * The widget will inherit these from the storefront theme automatically.
 *
 * Fallbacks are provided for when the theme doesn't define these variables.
 */

export const theme = {
  // Typography
  fonts: {
    body: `var(--fontFamily-sans, var(--body-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif))`,
    heading: `var(--fontFamily-headingSans, var(--heading-font-family, Georgia, serif))`,
  },

  fontSizes: {
    root: 'var(--fontSize-root, 1rem)',
    small: 'var(--fontSize-smallest, 0.875rem)',
    base: 'var(--fontSize-root, 1rem)',
    large: 'var(--fontSize-large, 1.125rem)',
    heading: 'var(--fontSize-hero, 1.5rem)',
  },

  // Colors
  colors: {
    // Base colors
    primary: 'var(--color-primary, var(--button-primary-backgroundColor, #3498db))',
    primaryHover: 'var(--color-primaryHover, var(--button-primary-backgroundColorHover, #2980b9))',
    secondary: 'var(--color-secondary, var(--button-default-backgroundColor, #6c757d))',

    // Text colors
    textBase: 'var(--color-textBase, var(--body-font-color, #333333))',
    textSecondary: 'var(--color-textSecondary, #666666)',
    textLink: 'var(--color-textLink, var(--color-primary, #3498db))',
    textLinkHover: 'var(--color-textLink-hover, var(--color-primaryHover, #2980b9))',

    // Background colors
    white: 'var(--color-white, #ffffff)',
    greyLightest: 'var(--color-greyLightest, #fafafa)',
    greyLighter: 'var(--color-greyLighter, #f5f5f5)',
    greyLight: 'var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0))',
    grey: 'var(--color-grey, #cccccc)',
    greyDark: 'var(--color-greyDark, #999999)',

    // State colors
    success: 'var(--color-success, #28a745)',
    warning: 'var(--color-warning, #ffc107)',
    error: 'var(--color-error, var(--color-errorDark, #dc3545))',
    errorLight: 'var(--color-errorLight, #fee)',
    info: 'var(--color-info, #17a2b8)',
  },

  // Borders
  borders: {
    color: 'var(--color-greyLight, var(--container-border-global-color-base, #e0e0e0))',
    width: 'var(--borderWidth-base, 1px)',
    radius: 'var(--borderRadius-base, 4px)',
    radiusLarge: 'var(--borderRadius-large, 8px)',
  },

  // Shadows
  shadows: {
    card: 'var(--elevation-100, 0 2px 4px rgba(0,0,0,0.1))',
    cardHover: 'var(--elevation-200, 0 4px 8px rgba(0,0,0,0.15))',
    button: 'var(--elevation-100, 0 2px 4px rgba(0,0,0,0.1))',
  },

  // Spacing
  spacing: {
    xs: 'var(--spacing-xs, 0.25rem)',
    sm: 'var(--spacing-sm, 0.5rem)',
    md: 'var(--spacing-md, 1rem)',
    lg: 'var(--spacing-lg, 1.5rem)',
    xl: 'var(--spacing-xl, 2rem)',
  },

  // Container/Layout
  container: {
    background: 'var(--container-fill-base, #ffffff)',
    border: 'var(--container-border-global-color-base, #e0e0e0)',
  },

  // Buttons
  buttons: {
    primary: {
      background: 'var(--button-primary-backgroundColor, #3498db)',
      backgroundHover: 'var(--button-primary-backgroundColorHover, #2980b9)',
      color: 'var(--button-primary-color, #ffffff)',
      colorHover: 'var(--button-primary-colorHover, #ffffff)',
      border: 'var(--button-primary-borderColor, transparent)',
    },
    secondary: {
      background: 'var(--button-default-backgroundColor, #6c757d)',
      backgroundHover: 'var(--button-default-backgroundColorHover, #5a6268)',
      color: 'var(--button-default-color, #ffffff)',
      colorHover: 'var(--button-default-colorHover, #ffffff)',
      border: 'var(--button-default-borderColor, transparent)',
    },
  },

  // Form elements
  form: {
    input: {
      background: 'var(--input-bg-color, #ffffff)',
      border: 'var(--input-border-color, var(--color-greyLight, #e0e0e0))',
      borderFocus: 'var(--input-border-color-active, var(--color-primary, #3498db))',
      color: 'var(--input-font-color, var(--color-textBase, #333333))',
      placeholder: 'var(--color-textSecondary, #999999)',
    },
  },
};

// Helper function to get theme variable
export const getThemeVar = (path: string, fallback?: string) => {
  const parts = path.split('.');
  let current: any = theme;

  for (const part of parts) {
    current = current?.[part];
    if (!current) break;
  }

  return current || fallback || '#000000';
};
