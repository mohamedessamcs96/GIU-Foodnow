import { Router } from "express";
import * as ctrl from "../controllers/orders.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  validate, validateId, isNonEmptyString, isPositiveInt, isOrderItems, isOneOf,
} from "../middleware/validate.js";

const STATUSES = ["pending", "preparing", "on_the_way", "delivered", "cancelled"];

const router = Router();

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

router.patch(
  "/:id/status",
  validateId(),
  validate({ status: isOneOf(STATUSES) }),
  asyncHandler(ctrl.changeStatus)
);

export default router;
