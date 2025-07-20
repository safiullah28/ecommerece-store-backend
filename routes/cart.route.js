import express from "express";
import {
  addToCart,
  getCartProducts,
  removeAllFromCart,
  updateQuantity,
} from "../controllers/cart.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
const cartRoute = express.Router();



cartRoute.post("/", protectRoute, addToCart);
cartRoute.delete("/", protectRoute,  removeAllFromCart);
cartRoute.put("/:id", protectRoute,  updateQuantity);
cartRoute.get("/", protectRoute,  getCartProducts);

export default cartRoute;
