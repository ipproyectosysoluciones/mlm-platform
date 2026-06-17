/**
 * Browser API wrappers — injectable for testability
 * Wraps window.location and window.history so tests can mock without
 * touching non-configurable jsdom properties.
 */
export const browserAPI = {
  reload: () => window.location.reload(),
  back: () => window.history.back(),
  getPathname: () => window.location.pathname,
};
