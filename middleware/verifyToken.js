import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { redis } from "../lib/redis.js";

export const refreshToken = async (req, res) => {
  try {
    const refreshTok = req.cookies.refreshToken;
    if (!refreshTok) {
      return res.status(404).json({
        message: "No refresh token provided",
      });
    }
    const decoded = jwt.verify(refreshTok, process.env.REFRESH_JWT_SECRET);
    const storedToken = await redis.get(`refreshToken:${decoded.id}`);
    if (storedToken !== refreshTok) {
      return res.status(404).json({
        message: "Invalid refresh token provided",
      });
    }

    const accessToken = jwt.sign(
      {
        id: decoded.id,
      },
      process.env.ACCESS_JWT_SECRET,
      { expiresIn: "15m" }
    );
    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 15 * 60 * 1000,
    });
    res.json({
      message: "Token refreshed successfully",
    });
  } catch (error) {}
};
