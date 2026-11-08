import { Router } from "express";
import * as ctrl from "../controllers/restaurants.controller.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { validateId } from "../middleware/validate.js";

const router = Router();

router.get("/", asyncHandler(ctrl.list));
router.get("/:id", validateId(), asyncHandler(ctrl.getOne));
router.get("/:id/menu", validateId(), asyncHandler(ctrl.menu));

export default router;
