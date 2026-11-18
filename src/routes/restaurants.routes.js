// ============================================================================
// routes/restaurants.routes.js
//
// A route file answers: "for this METHOD + URL, which checks run, and which
// controller handles it?" Middleware listed before the controller runs first,
// left to right. Mounted at /api/v1/restaurants in app.js, so "/" below means
// /api/v1/restaurants and "/:id" means /api/v1/restaurants/5.
// ============================================================================
import { Router } from "express";
import * as ctrl from "../controllers/restaurants.controller.js";
import * as menuCtrl from "../controllers/menu.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validate, validateId, requireAtLeastOne,
  isNonEmptyString, isNonNegativeNumber, isBoolean, optional,
} from "../middleware/validate.js";

const router = Router();

// ----- Read ------------------------------------------------------------------
router.get("/", asyncHandler(ctrl.list));
router.get("/:id", validateId(), asyncHandler(ctrl.getOne));
router.get("/:id/menu", validateId(), asyncHandler(ctrl.menu));

// ----- Write -----------------------------------------------------------------
router.post(
  "/",
  validate({
    name: isNonEmptyString,
    cuisine: isNonEmptyString,
    deliveryFee: optional(isNonNegativeNumber), // optional -> defaults to 0
    isOpen: optional(isBoolean), // optional -> defaults to true
  }),
  asyncHandler(ctrl.create)
);

router.patch(
  "/:id",
  validateId(),
  requireAtLeastOne(["name", "cuisine", "deliveryFee", "isOpen"]), // empty body = pointless request
  validate({
    name: optional(isNonEmptyString),
    cuisine: optional(isNonEmptyString),
    deliveryFee: optional(isNonNegativeNumber),
    isOpen: optional(isBoolean),
  }),
  asyncHandler(ctrl.update)
);

router.delete("/:id", validateId(), asyncHandler(ctrl.remove));

// Add a dish to this restaurant's menu.
router.post(
  "/:id/menu",
  validateId(),
  validate({
    name: isNonEmptyString,
    price: isNonNegativeNumber,
    isAvailable: optional(isBoolean),
  }),
  asyncHandler(menuCtrl.add)
);

export default router;
