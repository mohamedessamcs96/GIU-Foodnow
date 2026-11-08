import { AppError } from "../utils/AppError.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

// Error middleware: 4 arguments, registered last
export const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  if (status === 500) console.error(err);

  res.status(status).json({
    error: status === 500 ? "Something went wrong" : err.message,
    ...(err.details && { details: err.details }),
  });
};
