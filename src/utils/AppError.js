// ============================================================================
// utils/AppError.js  -  our own error type for "expected" problems.
//
// Throw it anywhere (service, middleware) and the error handler will turn it
// into a proper HTTP response:
//
//   throw new AppError("Order not found", 404);
//   -->  HTTP 404  {"error": "Order not found"}
//
// Anything that is NOT an AppError is treated as an unexpected bug (HTTP 500).
// ============================================================================
export class AppError extends Error {
  // message : text shown to the client
  // status  : HTTP status code (400 bad input, 404 not found, 409 conflict...)
  // details : optional extra info (e.g. the list of invalid fields)
  constructor(message, status = 500, details = undefined) {
    super(message); // sets `this.message` (and the stack trace) like a normal Error
    this.status = status;
    this.details = details;
  }
}
