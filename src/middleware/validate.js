// ============================================================================
// middleware/validate.js  -  input validation, built from small pieces.
//
// Never trust data from the client. We check it BEFORE it reaches a controller.
//
// Two kinds of building blocks:
//   1. CHECKERS: tiny functions `(value) => null | "error message"`
//      (null means "valid").
//   2. validate(rules): turns a set of checkers into an Express middleware.
//
// Example:
//   validate({ name: isNonEmptyString, price: optional(isNonNegativeNumber) })
// ============================================================================
import { AppError } from "../utils/AppError.js";

// ----- Checkers --------------------------------------------------------------

// A real, non-blank string. "   " is rejected.
export const isNonEmptyString = (v) =>
  typeof v === "string" && v.trim() !== "" ? null : "must be a non-empty string";

// 1, 2, 3 ... (typeof number AND whole AND > 0). "5" (a string) is rejected.
export const isPositiveInt = (v) =>
  Number.isInteger(v) && v > 0 ? null : "must be a positive integer";

// 0, 12, 45.5 ... used for prices and fees. NaN/Infinity are rejected.
export const isNonNegativeNumber = (v) =>
  typeof v === "number" && Number.isFinite(v) && v >= 0 ? null : "must be a number >= 0";

// true / false only (not "true", not 1).
export const isBoolean = (v) => (typeof v === "boolean" ? null : "must be true or false");

// QUERY-STRING values are always strings ("?limit=10" gives "10"), so we need
// a checker for "a string that contains a whole number".
export const isIntString = (v) =>
  typeof v === "string" && /^\d+$/.test(v) ? null : "must be a whole number";

// HIGHER-ORDER FUNCTION: takes a list, RETURNS a checker.
//   isOneOf(["a","b"])("c")  -->  "must be one of: a, b"
export const isOneOf = (allowed) => (v) =>
  allowed.includes(v) ? null : `must be one of: ${allowed.join(", ")}`;

// The `items` array of a new order: [{ menuItemId, quantity }, ...]
// `every` is true only if ALL elements pass the test.
export const isOrderItems = (v) =>
  Array.isArray(v) &&
  v.length > 0 &&
  v.every((i) => i && Number.isInteger(i.menuItemId) && Number.isInteger(i.quantity) && i.quantity > 0)
    ? null
    : "must be a non-empty array of { menuItemId, quantity } with quantity > 0";

// HIGHER-ORDER FUNCTION: makes any checker OPTIONAL. A missing field (undefined)
// is fine; if it IS present it must pass the wrapped checker.
//   optional(isBoolean)  -->  accepts undefined, true, false
export const optional = (check) => (v) => (v === undefined ? null : check(v));

// ----- Middleware factories ---------------------------------------------------

// HIGHER-ORDER FUNCTION: takes rules, RETURNS an Express middleware.
//   rules  : { fieldName: checkerFunction }
//   source : where to read the values: "body" (default) or "query" (?a=b)
//
// It collects ALL problems (not just the first) so the client can fix
// everything in one go, e.g. details: ["name: must be a non-empty string", ...].
export const validate = (rules, source = "body") => (req, res, next) => {
  const errors = Object.entries(rules)
    .map(([field, check]) => {
      const problem = check(req[source]?.[field]); // `?.` avoids a crash if body is undefined
      return problem && `${field}: ${problem}`; // null stays null, text becomes "field: text"
    })
    .filter(Boolean); // drop the nulls, keep only real errors

  if (errors.length > 0) throw new AppError("Validation failed", 400, errors);
  next(); // all good: continue to the next middleware / controller
};

// For PATCH endpoints: the body must contain AT LEAST ONE of the given fields,
// otherwise the request would change nothing.
export const requireAtLeastOne = (fields) => (req, res, next) => {
  const hasOne = fields.some((field) => req.body?.[field] !== undefined);
  if (!hasOne) throw new AppError(`Send at least one of: ${fields.join(", ")}`, 400);
  next();
};

// HIGHER-ORDER FUNCTION: checks that a URL parameter (default ":id") is a
// positive integer. "/orders/abc" is rejected here, so services can trust ids.
export const validateId = (param = "id") => (req, res, next) => {
  const value = Number(req.params[param]);
  if (!Number.isInteger(value) || value <= 0) {
    throw new AppError(`Invalid ${param}`, 400);
  }
  next();
};
