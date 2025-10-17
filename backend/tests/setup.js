// Global test setup
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = "mongodb://localhost:27017/creditsea-test";
process.env.CLERK_SECRET_KEY = "sk_test_mock_key_for_testing";


jest.setTimeout(30000);

// Mock Clerk SDK
jest.mock("@clerk/clerk-sdk-node", () => ({
  clerkClient: {
    verifyToken: jest.fn((token) => {
      if (token === "valid-token") {
        return Promise.resolve({ sub: "user_test123" });
      }
      if (token === "invalid-token") {
        return Promise.resolve(null);
      }
      throw new Error("Token verification failed");
    }),
  },
}));

// Suppress console logs during tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};
