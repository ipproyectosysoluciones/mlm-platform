/**
 * @fileoverview Mock for @sentry/node
 * Prevents Sentry v10 from hanging on import during tests
 */

const noop = () => {};
const returnThis = function (this: unknown) {
  return this;
};

const mockSpan = {
  setStatus: noop,
  setTag: noop,
  setData: noop,
  finish: noop,
};

const Sentry = {
  init: noop,
  captureException: noop,
  captureMessage: noop,
  captureEvent: noop,
  withScope: (fn: (scope: Record<string, unknown>) => void) => fn({}),
  configureScope: noop,
  addBreadcrumb: noop,
  setUser: noop,
  setTag: returnThis,
  setTags: returnThis,
  setContext: noop,
  startSpan: (_ctx: unknown, fn: (span: typeof mockSpan) => unknown) => fn(mockSpan),
  startInactiveSpan: () => mockSpan,
  setupExpressErrorHandler: noop,
  getGlobalScope: () => ({ setTag: noop, setUser: noop, setContext: noop }),
  getClient: () => undefined,
  isEnabled: () => false,
};

export default Sentry;
export const init = Sentry.init;
export const captureException = Sentry.captureException;
export const captureMessage = Sentry.captureMessage;
export const captureEvent = Sentry.captureEvent;
export const withScope = Sentry.withScope;
export const configureScope = Sentry.configureScope;
export const addBreadcrumb = Sentry.addBreadcrumb;
export const setUser = Sentry.setUser;
export const setTag = Sentry.setTag;
export const setTags = Sentry.setTags;
export const setContext = Sentry.setContext;
export const startSpan = Sentry.startSpan;
export const startInactiveSpan = Sentry.startInactiveSpan;
export const setupExpressErrorHandler = Sentry.setupExpressErrorHandler;
export const getGlobalScope = Sentry.getGlobalScope;
export const getClient = Sentry.getClient;
export const isEnabled = Sentry.isEnabled;
