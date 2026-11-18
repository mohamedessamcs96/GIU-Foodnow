// ============================================================================
// server.js  -  the entry point (`npm start` runs this file).
//
// Its only jobs: check the database works, start listening for HTTP requests,
// and shut down cleanly. The app itself (middleware + routes) is built in
// app.js; keeping them apart lets tests import `app` without opening a port.
// ============================================================================
import app from "./app.js";
import { config } from "./config/env.js";
import { pool } from "./db.js";

// 1. Check the database BEFORE accepting traffic. (Top-level `await` works
//    because package.json has "type": "module".)
try {
  const { rows } = await pool.query("SELECT NOW()");
  console.log("Database connected at", rows[0].now);
} catch (err) {
  console.error("Could not connect to the database:", err.message);
  process.exit(1); // exit code 1 = "failed"; nothing useful can run without a DB
}

// 2. Start the HTTP server.
const server = app.listen(config.port, () =>
  console.log(`FoodNow API running at http://localhost:${config.port}  (docs: /doc)`)
);

// 3. Graceful shutdown. When you press Ctrl+C (SIGINT) or a host such as Docker
//    stops the app (SIGTERM) we: stop accepting new requests, let running ones
//    finish, close the DB connections, then exit.
const shutdown = (signal) => {
  console.log(`${signal} received, shutting down...`);
  server.close(async () => {
    await pool.end();
    process.exit(0); // 0 = clean exit
  });
};
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
