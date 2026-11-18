// ============================================================================
// controllers/orders.controller.js  -  HTTP layer for orders.
// ============================================================================
import * as service from "../services/orders.service.js";

// Paging defaults and the hard cap, so nobody can request 1,000,000 rows.
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// GET /api/v1/orders?status=&restaurantId=&limit=&offset=
export const list = async (req, res) => {
  const { status, restaurantId, limit, offset } = req.query;
  res.json(
    await service.listOrders({
      status,
      restaurantId: restaurantId ? Number(restaurantId) : undefined,
      // clamp limit into [1, MAX_LIMIT]; offset defaults to 0
      limit: Math.min(Math.max(Number(limit ?? DEFAULT_LIMIT), 1), MAX_LIMIT),
      offset: Number(offset ?? 0),
    })
  );
};

// POST /api/v1/orders   -> 201 Created
export const create = async (req, res) => {
  const order = await service.createOrder(req.body);
  res.status(201).json(order);
};

// GET /api/v1/orders/:id
export const getOne = async (req, res) => {
  res.json(await service.getOrder(Number(req.params.id)));
};

// PATCH /api/v1/orders/:id/status
export const changeStatus = async (req, res) => {
  res.json(await service.updateStatus(Number(req.params.id), req.body.status));
};

// POST /api/v1/orders/:id/cancel
export const cancel = async (req, res) => {
  res.json(await service.cancelOrder(Number(req.params.id)));
};
