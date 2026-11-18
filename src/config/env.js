// ============================================================================
// config/env.js  -  the ONLY place that reads environment variables.
//
// Why? If every file read process.env directly, we would have "magic strings"
// spread everywhere and typos would fail silently. Here we:
//   1. read each variable once,
//   2. give it a sensible default (or fail fast if it is mandatory),
//   3. export a plain `config` object the rest of the app imports.
//
// Where do the values come from? From the `.env` file. The npm scripts start
// Node with `--env-file=.env`, which loads that file into `process.env`.
// ============================================================================

// Helper: return the variable's value, or crash at startup if it is missing.
// "Fail fast" = better to stop immediately with a clear message than to run
// half-broken and fail later with a confusing database error.
const required = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

export const config = {
  // Port the HTTP server listens on. Env values are always strings, so convert.
  // `|| 3000` = use 3000 if PORT is missing or not a number.
  port: Number(process.env.PORT) || 3000,

  // Postgres connection string, e.g. postgres://user:password@localhost:5432/foodnow_db
  databaseUrl: required("DATABASE_URL"),

  // Browser origins allowed to call this API (CORS), e.g. "http://localhost:5173".
  // Written as a comma-separated list in .env, turned into an array here:
  //   "a, b,,c"  --split-->  ["a"," b","","c"]  --trim-->  ["a","b","","c"]  --filter-->  ["a","b","c"]
  // An empty array means "allow every origin" (fine for development only).
  corsOrigins: (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean), // Boolean("") is false, so empty entries are removed
};
