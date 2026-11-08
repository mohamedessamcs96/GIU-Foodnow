// HIGHER-ORDER FUNCTION: takes an async route handler and returns a new
// handler that forwards any rejected promise to Express's error middleware.
// (Express 5 does this natively, Express 4 needs it. Good habit either way.)
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
