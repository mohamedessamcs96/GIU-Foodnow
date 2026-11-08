import app from "./app.js";
import { pool } from "./db.js";

const port = process.env.PORT || 3000;

try {
  const { rows } = await pool.query("SELECT NOW()");
  console.log("Database connected at", rows[0].now);
} catch (err) {
  console.error("Could not connect to the database:", err.message);
  process.exit(1);
}

app.listen(port, () => console.log(`FoodNow API running at http://localhost:${port}`));
