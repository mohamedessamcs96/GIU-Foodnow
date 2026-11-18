// ============================================================================
// db.js  -  everything about talking to PostgreSQL.
//
// Other files NEVER create their own connections; they import from here.
// ============================================================================
import pg from "pg";
import { config } from "./config/env.js";

// A "pool" keeps several database connections open and hands them out on
// demand. Opening a connection for every request would be slow; reusing them
// from a pool is fast.
export const pool = new pg.Pool({ connectionString: config.databaseUrl });

// Run ONE query using any free connection from the pool.
//   query("SELECT * FROM restaurants WHERE id = $1", [5])
// $1, $2... are placeholders. pg sends the values separately from the SQL text,
// which makes SQL injection impossible. NEVER build SQL with string concatenation
// of user input.
export const query = (text, params) => pool.query(text, params);

// ----------------------------------------------------------------------------
// withTransaction  -  a HIGHER-ORDER FUNCTION (it receives a function).
//
// A transaction groups several queries so they succeed or fail AS ONE UNIT.
// Example: creating an order inserts a row in `orders` and rows in
// `order_items`. If the second insert failed we must not keep the first one.
//
// Usage:
//   await withTransaction(async (client) => {
//     await client.query("INSERT ...");
//     await client.query("INSERT ...");
//   });
//
// IMPORTANT: inside `work` use the `client` you are given (NOT `query`), because
// a transaction only exists on ONE specific connection.
// ----------------------------------------------------------------------------
export const withTransaction = async (work) => {
  const client = await pool.connect(); // borrow one connection from the pool
  try {
    await client.query("BEGIN"); // start the transaction
    const result = await work(client); // run the caller's code
    await client.query("COMMIT"); // everything worked: save permanently
    return result;
  } catch (err) {
    await client.query("ROLLBACK"); // something failed: undo everything
    throw err; // re-throw so the error handler can answer the client
  } finally {
    client.release(); // ALWAYS give the connection back to the pool
  }
};
