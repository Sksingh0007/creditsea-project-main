/* eslint-disable no-undef */
import "@testing-library/jest-dom";


global.importMetaEnv = {
  VITE_API_BASE_URL: "http://localhost:5001",
};


if (typeof global.import === "undefined") {
  global.import = {};
}
if (typeof global.import.meta === "undefined") {
  global.import.meta = {};
}
global.import.meta.env = {
  VITE_API_BASE_URL: "http://localhost:5010",
};


Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
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

jest.mock("@clerk/clerk-react", () => ({
  useAuth: () => ({
    getToken: jest.fn(() => Promise.resolve("mock-token")),
    isSignedIn: true,
    isLoaded: true,
    userId: "user_test123",
    signOut: jest.fn(),
  }),
  useUser: () => ({
    isSignedIn: true,
    isLoaded: true,
    user: {
      id: "user_test123",
      primaryEmailAddress: { emailAddress: "test@example.com" },
    },
  }),
  SignedIn: ({ children }) => <>{children}</>,
  SignedOut: () => null,
  UserButton: () => <button>User</button>,
  SignIn: () => <div>Sign In</div>,
  SignUp: () => <div>Sign Up</div>,
  ClerkProvider: ({ children }) => <>{children}</>,
}));