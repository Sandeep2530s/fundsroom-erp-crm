import { Router } from "express";
import {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  addFollowUpNote,
} from "../controllers/customerController";
import {
  authenticate,
  authorizeRoles,
} from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, getCustomers);

router.get("/:id", authenticate, getCustomerById);

router.post(
  "/",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  addCustomer
);

router.put(
  "/:id",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  updateCustomer
);

router.post(
  "/:id/follow-up",
  authenticate,
  authorizeRoles("ADMIN", "SALES"),
  addFollowUpNote
);

export default router;