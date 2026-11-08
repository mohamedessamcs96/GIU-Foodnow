import * as service from "../services/restaurants.service.js";

export const list = async (req, res) => {
  const { cuisine, open } = req.query;
  const restaurants = await service.listRestaurants({ cuisine, openOnly: open === "true" });
  res.json({ total: restaurants.length, data: restaurants });
};

export const getOne = async (req, res) => {
  res.json(await service.getRestaurant(Number(req.params.id)));
};

export const menu = async (req, res) => {
  res.json({ data: await service.getMenu(Number(req.params.id)) });
};
