import { AppError } from "../utils/AppError.js";

// ----- rule helpers: each checker returns null (ok) or an error message -----
export const isNonEmptyString = (v) =>
  typeof v === "string" && v.trim() !== "" ? null : "must be a non-empty string";

export const isPositiveInt = (v) =>
  Number.isInteger(v) && v > 0 ? null : "must be a positive integer";

// HIGHER-ORDER FUNCTION: takes a list, returns a checker function
export const isOneOf = (allowed) => (v) =>
  allowed.includes(v) ? null : `must be one of: ${allowed.join(", ")}`;

export const isOrderItems = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((i) => i && Number.isInteger(i.menuItemId) && Number.isInteger(i.quantity) && i.quantity > 0)
    ? null
    : "must be a non-empty array of { menuItemId, quantity } with quantity > 0";

// HIGHER-ORDER FUNCTION: takes rules, returns an Express middleware.
// validate({ name: isNonEmptyString }) -> (req, res, next) => ...
export const validate = (rules) => (req, res, next) => {
  const errors = Object.entries(rules)
    .map(([field, check]) => {
      const problem = check(req.body?.[field]);
      return problem && `${field}: ${problem}`;
    })
    .filter(Boolean);

  if (errors.length > 0) throw new AppError("Validation failed", 400, errors);
  next();
};

// HIGHER-ORDER FUNCTION: returns a middleware that checks a numeric URL param
export const validateId = (param = "id") => (req, res, next) => {
  const value = Number(req.params[param]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(`Invalid ${param}`, 400);
  }
  next();
};
