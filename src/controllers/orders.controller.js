import * as service from "../services/orders.service.js";

export const create = async (req, res) => {
  const order = await service.createOrder(req.body);
  res.status(201).json(order);
};

export const getOne = async (req, res) => {
  res.json(await service.getOrder(Number(req.params.id)));
};

export const changeStatus = async (req, res) => {
  res.json(await service.updateStatus(Number(req.params.id), req.body.status));
};
