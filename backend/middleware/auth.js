const { clerkClient } = require("@clerk/clerk-sdk-node");

const requireAuth = async (req, res, next) => {
  try {

    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }


    const sessionClaims = await clerkClient.verifyToken(token);

    if (!sessionClaims) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Invalid token",
      });
    }


    req.userId = sessionClaims.sub;
    next();
  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Authentication failed",
    });
  }
};

module.exports = { requireAuth };
