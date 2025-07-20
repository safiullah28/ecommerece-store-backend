import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
export const protectRoute = async (req, res, next) => {
  try {
    const accesstoken = req.cookies.accessToken;
    if (!accesstoken) {
      return res.status(401).json({
        message: "No token provided",
      });
    }
    try {
      const decoded = jwt.verify(accesstoken, process.env.ACCESS_JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (!user) {
        return res.status(401).json({
          message: "User not found",
        });
      }
      req.user = user;
      next();
    } catch (e) {
      if (e.name === "TokenExpiredError")
        return res.status(404).json({
          message: "Unauthorized: Access Token expired",
        });
      throw e;
    }
  } catch (error) {
    console.error("Error in protectRoute controller " + error);
    res.status(500).json({
      message: "Error : " + error,
    });
  }
};
