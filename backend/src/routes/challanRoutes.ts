import { Router } from "express";
import {
  createChallan,
  getChallans,
  getChallanById,
  cancelChallan,
} from "../controllers/challanController";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, getChallans);

router.put(
  "/:id/cancel",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  cancelChallan
);

router.get("/:id", authenticate, getChallanById);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  createChallan
);

export default router;