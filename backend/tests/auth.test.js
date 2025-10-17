const { requireAuth } = require("../../middleware/auth");


jest.mock("@clerk/clerk-sdk-node");
const { clerkClient } = require("@clerk/clerk-sdk-node");

describe("Authentication Middleware Tests", () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe("requireAuth middleware", () => {
    test("should pass with valid token", async () => {
      req.headers.authorization = "Bearer valid-token";
      clerkClient.verifyToken.mockResolvedValue({ sub: "user_123" });

      await requireAuth(req, res, next);

      expect(req.userId).toBe("user_123");
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test("should reject request with no token", async () => {
      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized - No token provided",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with invalid token", async () => {
      req.headers.authorization = "Bearer invalid-token";
      clerkClient.verifyToken.mockResolvedValue(null);

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized - Invalid token",
      });
      expect(next).not.toHaveBeenCalled();
    });

    test("should reject request with malformed token", async () => {
      req.headers.authorization = "InvalidFormat token123";
      clerkClient.verifyToken.mockRejectedValue(
        new Error("Invalid token format")
      );

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    test("should handle verification errors gracefully", async () => {
      req.headers.authorization = "Bearer error-token";
      clerkClient.verifyToken.mockRejectedValue(
        new Error("Service unavailable")
      );

      await requireAuth(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: "Unauthorized - Authentication failed",
      });
    });
  });
});
