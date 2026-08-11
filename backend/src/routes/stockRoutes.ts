import { Router } from "express";
import {
  stockIn,
  stockOut,
  getStockMovements,
} from "../controllers/stockController";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.post(
  "/in",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  stockIn
);

router.post(
  "/out",
  authenticate,
  authorizeRoles("ADMIN", "WAREHOUSE"),
  stockOut
);

router.get(
  "/movements",
  authenticate,
  getStockMovements
);

export default router;