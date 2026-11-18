// ============================================================================
// routes/orders.routes.js  -  mounted at /api/v1/orders.
// ============================================================================
import { Router } from "express";
import * as ctrl from "../controllers/orders.controller.js";
import { ORDER_STATUSES } from "../constants/orderStatus.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validate, validateId, isNonEmptyString, isPositiveInt, isOrderItems, isOneOf,
  isIntString, optional,
} from "../middleware/validate.js";

const router = Router();

// List orders. The second argument "query" tells validate() to check the URL's
// query string (?status=...) instead of the JSON body.
router.get(
  "/",
  validate(
    {
      status: optional(isOneOf(ORDER_STATUSES)),
      restaurantId: optional(isIntString),
      limit: optional(isIntString),
      offset: optional(isIntString),
    },
    "query"
  ),
  asyncHandler(ctrl.list)
);

// Place an order. All four fields are required.
router.post(
  "/",
  validate({
    restaurantId: isPositiveInt,
    customerName: isNonEmptyString,
    address: isNonEmptyString,
    items: isOrderItems,
  }),
  asyncHandler(ctrl.create)
);

router.get("/:id", validateId(), asyncHandler(ctrl.getOne));

// Move an order along its life cycle (see the state diagram in /doc/architecture).
router.patch(
  "/:id/status",
  validateId(),
  validate({ status: isOneOf(ORDER_STATUSES) }),
  asyncHandler(ctrl.changeStatus)
);

// Convenience: cancel without sending a body.
router.post("/:id/cancel", validateId(), asyncHandler(ctrl.cancel));

export default router;
