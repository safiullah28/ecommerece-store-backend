import express from "express";
import {
  getFeaturedProducts,
  getAllProducts,
  createProduct,
  deleteProduct,
  getRecommendedProducts,
  getProductsByCategory,
  toggleFeaturedProduct,
} from "../controllers/product.controller.js";
import { protectRoute } from "../middleware/protectRoute.js";
import { adminRoute } from "../controllers/auth.controller.js";
const productRoute = express.Router();

productRoute.get("/", protectRoute, adminRoute, getAllProducts);
productRoute.post("/", protectRoute, adminRoute, createProduct);
productRoute.delete("/:id", protectRoute, adminRoute, deleteProduct);
productRoute.get("/featuredProducts", getFeaturedProducts);
productRoute.get("/recommendations", getRecommendedProducts);
productRoute.get("/category/:category", getProductsByCategory);
productRoute.patch("/:id", protectRoute, adminRoute, toggleFeaturedProduct);
export default productRoute;
