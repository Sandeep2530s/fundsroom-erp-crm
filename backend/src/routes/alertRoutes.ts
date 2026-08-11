import { Router } from "express";
import { getLowStockProducts } from "../controllers/alertController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/low-stock", authenticate, getLowStockProducts);

export default router;