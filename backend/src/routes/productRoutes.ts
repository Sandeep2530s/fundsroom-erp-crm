import { Router } from "express";
import {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
} from "../controllers/productController";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

// List/search products
router.get("/", authenticate, getProducts);

// View product details
router.get("/:id", authenticate, getProductById);

// Add product
router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  addProduct
);

// Edit product
router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  updateProduct
);

export default router;