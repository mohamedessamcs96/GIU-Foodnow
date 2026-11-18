// ============================================================================
// app.js  -  builds the Express application (but does NOT start it).
//
// ORDER MATTERS in Express: a request passes through app.use(...) lines from
// top to bottom. So: security/logging/parsing first, routes next, "not found"
// and the error handler LAST.
// ============================================================================
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import restaurantsRouter from "./routes/restaurants.routes.js";
import menuItemsRouter from "./routes/menuItems.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import docsRouter from "./routes/docs.routes.js";
import { config } from "./config/env.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

// ----- Global middleware (runs for EVERY request) ---------------------------

// helmet: adds security-related HTTP response headers (hides "X-Powered-By",
// blocks content sniffing, sets a Content-Security-Policy, ...).
app.use(helmet());

// cors: decides which websites (browser origins) may call this API.
// With CORS_ORIGINS set we only allow those; otherwise everyone (dev only).
app.use(cors(config.corsOrigins.length ? { origin: config.corsOrigins } : undefined));

// morgan: prints one log line per request, e.g. "GET /health 200 2 ms".
app.use(morgan("dev"));

// express.json: reads the request body, and if it is JSON puts the parsed
// object in `req.body`. The size limit stops huge payloads.
app.use(express.json({ limit: "100kb" }));

// express.static: serves the files in ./public (our landing page at "/").
app.use(express.static("public"));

// Rate limiter: each IP address may make 100 API calls per minute. More than
// that gets HTTP 429 "Too Many Requests". Protects against abuse and bugs.
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // the time window: 1 minute
  limit: 100, // max requests per window per IP
  standardHeaders: true, // send the standard RateLimit-* headers
  legacyHeaders: false, // do not send the old X-RateLimit-* headers
  message: { error: "Too many requests, please try again later" },
});

// ----- Routes ---------------------------------------------------------------

// A tiny endpoint for uptime monitors / load balancers.
app.get("/health", (req, res) => res.json({ status: "ok" }));

// Documentation pages live under /doc (not rate limited, not part of the API).
app.use("/doc", docsRouter);

// The real API. The limiter is attached to the "/api/v1" prefix, so it covers
// every router mounted below it. "v1" lets us ship a v2 later without
// breaking existing clients.
app.use("/api/v1", apiLimiter);
app.use("/api/v1/restaurants", restaurantsRouter);
app.use("/api/v1/menu-items", menuItemsRouter);
app.use("/api/v1/orders", ordersRouter);

// ----- Fallbacks (must stay LAST) -------------------------------------------

// No route above matched -> create a 404 error...
app.use(notFound);
// ...and this turns ANY error (404s, validation errors, crashes) into JSON.
app.use(errorHandler);

export default app;
