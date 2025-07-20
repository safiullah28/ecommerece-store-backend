import express from "express";
import {
  forgotPassword,
  getProfile,
  Login,
  Logout,
  resetPassword,
  Signup,
} from "../controllers/auth.controller.js";
import { protectRoute } from "./../middleware/protectRoute.js";
const authRoute = express.Router();

authRoute.post("/signup", Signup);
authRoute.post("/login", Login);
authRoute.post("/logout", Logout);
authRoute.get("/profile", protectRoute, getProfile);

authRoute.post("/forgotPassword", forgotPassword);
authRoute.post("/resetPassword/:resetToken", resetPassword);

export default authRoute;
