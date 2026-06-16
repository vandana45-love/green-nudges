import "@testing-library/jest-dom";

// Provide a fake Gemini key so modules that read it at load time don't short-circuit
process.env.NEXT_PUBLIC_GEMINI_API_KEY = "test-key-for-jest";

// Mock ResizeObserver (used by Recharts, not available in jsdom)
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
