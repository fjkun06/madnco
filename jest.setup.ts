import "@testing-library/jest-dom";

// Polyfill IntersectionObserver for framer-motion in jsdom
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof IntersectionObserver;

// Browser polyfills — skipped in suites that run in the node environment (API routes)
const isBrowser = typeof window !== "undefined";

// jsdom has no matchMedia; default to "no preference" (tests can override)
if (isBrowser && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      addListener: jest.fn(),
      removeListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// jsdom has no scrollIntoView
if (isBrowser && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = jest.fn();
}
