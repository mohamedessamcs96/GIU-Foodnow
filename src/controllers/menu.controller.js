// ============================================================================
// controllers/menu.controller.js  -  HTTP layer for menu items.
// ============================================================================
import * as service from "../services/menu.service.js";

// POST /api/v1/restaurants/:id/menu   -> 201 Created
export const add = async (req, res) => {
  const item = await service.addMenuItem(Number(req.params.id), req.body);
  res.status(201).json(item);
};

// PATCH /api/v1/menu-items/:id
export const update = async (req, res) => {
  res.json(await service.updateMenuItem(Number(req.params.id), req.body));
};
