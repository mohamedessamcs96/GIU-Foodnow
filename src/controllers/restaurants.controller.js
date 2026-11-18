// ============================================================================
// controllers/restaurants.controller.js
//
// A controller is the thin "HTTP adapter":
//   read from req  ->  call ONE service function  ->  write to res.
// No SQL and no business rules here. By the time a controller runs, the route's
// validation middleware has already checked the input.
//
// Note: ids come from the URL as strings, so we convert with Number(...).
// ============================================================================
import * as service from "../services/restaurants.service.js";

// GET /api/v1/restaurants?cuisine=&open=true&q=
export const list = async (req, res) => {
  const { cuisine, open, q } = req.query;
  const restaurants = await service.listRestaurants({
    cuisine,
    search: q,
    openOnly: open === "true", // query values are strings, so compare with "true"
  });
  res.json({ total: restaurants.length, data: restaurants });
};

// GET /api/v1/restaurants/:id
export const getOne = async (req, res) => {
  res.json(await service.getRestaurant(Number(req.params.id)));
};

// GET /api/v1/restaurants/:id/menu
export const menu = async (req, res) => {
  res.json({ data: await service.getMenu(Number(req.params.id)) });
};

// POST /api/v1/restaurants   -> 201 Created
export const create = async (req, res) => {
  res.status(201).json(await service.createRestaurant(req.body));
};

// PATCH /api/v1/restaurants/:id
export const update = async (req, res) => {
  res.json(await service.updateRestaurant(Number(req.params.id), req.body));
};

// DELETE /api/v1/restaurants/:id   -> 204 No Content (success, nothing to send back)
export const remove = async (req, res) => {
  await service.deleteRestaurant(Number(req.params.id));
  res.status(204).end();
};
