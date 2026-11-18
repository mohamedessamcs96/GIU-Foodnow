// ============================================================================
// routes/menuItems.routes.js  -  mounted at /api/v1/menu-items.
// Works on ONE dish directly by its id (adding a dish is under
// /restaurants/:id/menu because a dish always belongs to a restaurant).
// ============================================================================
import { Router } from "express";
import * as ctrl from "../controllers/menu.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validate, validateId, requireAtLeastOne,
  isNonEmptyString, isNonNegativeNumber, isBoolean, optional,
} from "../middleware/validate.js";

const router = Router();

router.patch(
  "/:id",
  validateId(),
  requireAtLeastOne(["name", "price", "isAvailable"]),
  validate({
    name: optional(isNonEmptyString),
    price: optional(isNonNegativeNumber),
    isAvailable: optional(isBoolean),
  }),
  asyncHandler(ctrl.update)
);

export default router;
