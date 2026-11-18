// ============================================================================
// utils/asyncHandler.js
//
// HIGHER-ORDER FUNCTION = a function that takes a function and/or returns one.
//
// Problem: in older Express (v4), if an `async` handler throws, the error is
// NOT passed to the error middleware and the request hangs. This wrapper
// catches the rejected promise and calls `next(err)`, which hands it to
// middleware/errorHandler.js.
//
// Express 5 already does this by itself, but wrapping routes keeps the intent
// obvious and the code working if someone downgrades Express.
//
//   router.get("/", asyncHandler(ctrl.list));
// ============================================================================
export const asyncHandler = (fn) => (req, res, next) =>
  // Promise.resolve() lets this work for sync and async handlers alike.
  Promise.resolve(fn(req, res, next)).catch(next);
