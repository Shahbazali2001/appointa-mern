import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";

const protectMiddleware = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    req.user = { id: decoded.userId }; // Attach user ID to request object
    next();
  } else {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
});

export default protectMiddleware;
