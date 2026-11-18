// ============================================================================
// middleware/errorHandler.js  -  the two "safety net" middlewares.
// Both are registered LAST in app.js.
// ============================================================================
import { AppError } from "../utils/AppError.js";

// Reached only when NO route matched the URL. We create a 404 error and pass
// it on with next(err), so it ends up in errorHandler below.
export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Express recognises ERROR middleware by its 4 parameters (err, req, res, next).
// Every error thrown or passed to next(err) anywhere ends up here, so ALL
// error responses share the same JSON shape: { error, details? }.
export const errorHandler = (err, req, res, next) => {
  // Where does `status` come from?
  //  * AppError          -> the status we chose
  //  * body-parser error -> 400 for invalid JSON (it sets err.status itself)
  //  * PostgreSQL error 23503 (foreign key violation, e.g. deleting a restaurant
  //    that still has orders) -> 409 Conflict
  //  * anything else     -> 500 (an unexpected bug)
  let status = err.status || 500;
  let message = err.message;
  if (err.code === "23503") {
    status = 409;
    message = "Cannot complete this action because other records depend on it";
  }

  // Log real bugs for the developer, but never send their details to clients
  // (stack traces and SQL text can leak internals).
  if (status === 500) console.error(err);

  res.status(status).json({
    error: status === 500 ? "Something went wrong" : message,
    // Only include `details` when there are some (spread of `undefined` adds nothing).
    ...(err.details && { details: err.details }),
  });
};
