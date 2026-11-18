// ============================================================================
// docs/pages.js  -  builds the HTML for the documentation pages.
// Each render* function returns a complete HTML string. They are used by
//   * src/routes/docs.routes.js   (live pages under /doc)
//   * scripts/build-docs-site.js  (static copy in docs-site/ for Vercel)
// Keeping the HTML as plain template strings means no template engine is needed.
// ============================================================================
import { diagrams } from "./diagrams.js";

// Escape characters that have meaning in HTML, so text/code shows literally.
const escapeHtml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// CSS shared by all pages.
const STYLES = `
  :root { font: 16px/1.6 system-ui, sans-serif; color: #17212b; background: #f4f7f9; }
  body { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
  nav a { margin-right: 1rem; }
  h1, h2 { line-height: 1.2; } h2 { margin-top: 2.5rem; }
  .muted { color: #526170; }
  section, .endpoint { background: #fff; border: 1px solid #dce3e8; border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; }
  .endpoint h3 { margin: 0 0 .5rem; }
  code { font-family: ui-monospace, Menlo, monospace; }
  pre { overflow-x: auto; padding: 1rem; border-radius: 6px; background: #17212b; color: #f4f7f9; }
  .method { display: inline-block; min-width: 4.5rem; font-weight: 700; color: #075e54; }
  .mermaid { text-align: center; overflow-x: auto; }
  table { border-collapse: collapse; width: 100%; } th, td { text-align: left; padding: .4rem .6rem; border-bottom: 1px solid #dce3e8; vertical-align: top; }
  @media (max-width: 600px) { body { padding: 1rem .75rem 3rem; } }`;

// The common page shell: <head>, navigation, and the page body.
const layout = (title, body, extraHead = "") => `<!doctype html>
<html lang="en"><head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title><style>${STYLES}</style>${extraHead}
</head><body>
  <nav><a href="/doc/guide">Getting started</a><a href="/doc">API reference</a><a href="/doc/architecture">Architecture &amp; diagrams</a></nav>
  ${body}
</body></html>`;

export const renderApiReference = () =>
  layout(
    "FoodNow API documentation",
    `
    <h1>FoodNow API</h1>
    <p class="muted">Version 1 · Base path: <code>/api/v1</code></p>
    <p>Browse restaurants and menus, place orders, and track order status. All responses are JSON except the <code>/doc</code> pages.</p>

    <h2>Health and documentation</h2>
    <div class="endpoint"><h3><span class="method">GET</span><code>/health</code></h3><p>Is the API process alive?</p><pre>{"status":"ok"}</pre></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc</code></h3><p>This API reference.</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc/guide</code></h3><p>Getting started: setup, env vars, request flow, code tour, troubleshooting.</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc/architecture</code></h3><p>Project structure, request flow, ERD and sequence diagrams (rendered).</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc/diagrams</code></h3><p>JSON list of all diagrams with their Mermaid source.</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc/diagrams/:name</code></h3><p>Raw Mermaid text of one diagram. Names: ${Object.keys(diagrams).map((n) => `<code>${n}</code>`).join(", ")}.</p></div>

    <h2>Restaurants</h2>
    <div class="endpoint"><h3><span class="method">GET</span><code>/api/v1/restaurants</code></h3>
      <p>Optional query: <code>cuisine</code> (case-insensitive), <code>open=true</code>, <code>q</code> (name contains). Response: <code>{ total, data }</code>.</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/api/v1/restaurants/:id</code></h3><p>One restaurant. 404 if missing.</p></div>
    <div class="endpoint"><h3><span class="method">POST</span><code>/api/v1/restaurants</code></h3>
      <pre>{ "name": "Burger Hub", "cuisine": "american", "deliveryFee": 18, "isOpen": true }</pre>
      <p><code>name</code> and <code>cuisine</code> required; <code>deliveryFee</code> (default 0) and <code>isOpen</code> (default true) optional. Returns 201.</p></div>
    <div class="endpoint"><h3><span class="method">PATCH</span><code>/api/v1/restaurants/:id</code></h3>
      <pre>{ "isOpen": false }</pre>
      <p>Send any of <code>name</code>, <code>cuisine</code>, <code>deliveryFee</code>, <code>isOpen</code> (at least one). Only the fields you send change.</p></div>
    <div class="endpoint"><h3><span class="method">DELETE</span><code>/api/v1/restaurants/:id</code></h3>
      <p>Deletes the restaurant and its menu. Returns 204. Returns 409 if the restaurant already has orders.</p></div>

    <h2>Menu</h2>
    <div class="endpoint"><h3><span class="method">GET</span><code>/api/v1/restaurants/:id/menu</code></h3><p>Available menu items. Response: <code>{ data }</code>. 404 if the restaurant is missing.</p></div>
    <div class="endpoint"><h3><span class="method">POST</span><code>/api/v1/restaurants/:id/menu</code></h3>
      <pre>{ "name": "Falafel Wrap", "price": 35, "isAvailable": true }</pre>
      <p>Adds a dish. <code>name</code> and <code>price</code> required. Returns 201.</p></div>
    <div class="endpoint"><h3><span class="method">PATCH</span><code>/api/v1/menu-items/:id</code></h3>
      <pre>{ "price": 50, "isAvailable": false }</pre>
      <p>Change <code>name</code>, <code>price</code> or <code>isAvailable</code> (mark sold out). Old orders keep the price they were placed with.</p></div>

    <h2>Orders</h2>
    <div class="endpoint"><h3><span class="method">GET</span><code>/api/v1/orders</code></h3>
      <p>Lists orders, newest first. Optional query: <code>status</code>, <code>restaurantId</code>, <code>limit</code> (default 20, max 100), <code>offset</code> (default 0).</p>
      <p>Response: <code>{ total, limit, offset, data }</code>, where <code>total</code> counts all matches (for page buttons).</p></div>
    <div class="endpoint"><h3><span class="method">POST</span><code>/api/v1/orders</code></h3>
      <p>Places an order at an open restaurant. Prices are calculated by the API, never taken from the client.</p>
      <pre>{
  "restaurantId": 1,
  "customerName": "Sara",
  "address": "12 Tahrir St, Giza",
  "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 3, "quantity": 1 } ]
}</pre>
      <p>201 with the created order. 400 for validation errors, closed restaurant or unavailable items. 404 if the restaurant is missing.</p></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/api/v1/orders/:id</code></h3><p>Order with its items. 404 if missing.</p></div>
    <div class="endpoint"><h3><span class="method">PATCH</span><code>/api/v1/orders/:id/status</code></h3>
      <pre>{ "status": "preparing" }</pre>
      <p>Only valid transitions are allowed (see the state diagram on the architecture page). An invalid move returns 409 with the allowed statuses.</p></div>
    <div class="endpoint"><h3><span class="method">POST</span><code>/api/v1/orders/:id/cancel</code></h3>
      <p>Cancels an order (no body). Same rules as status changes: only <code>pending</code> or <code>preparing</code> orders can be cancelled, otherwise 409.</p></div>

    <h2>Errors</h2>
    <pre>{ "error": "Validation failed", "details": ["customerName: must be a non-empty string"] }</pre>`
  );

const MERMAID_SCRIPT = `
  <script type="module">
    import mermaid from "https://cdn.jsdelivr.net/npm/mermaid@11.4.1/dist/mermaid.esm.min.mjs";
    mermaid.initialize({ startOnLoad: true, theme: "default" });
  </script>`;

const FOLDER_TREE = `food-now/
├─ sql/
│  ├─ schema.sql            tables, constraints, indexes
│  └─ seed.sql              sample data
└─ src/
   ├─ server.js             start: check DB, listen, graceful shutdown
   ├─ app.js                build Express app: middleware + routes
   ├─ db.js                 pg pool + withTransaction()
   ├─ config/env.js         read/validate environment variables
   ├─ constants/            order statuses + allowed transitions
   ├─ routes/               URL -> validation -> controller
   ├─ controllers/          HTTP in/out only (no SQL, no rules)
   ├─ services/             business rules + SQL
   ├─ middleware/           validate.js, errorHandler.js
   ├─ utils/                AppError, asyncHandler, money helpers
   └─ docs/                 this documentation (diagrams + pages)`;

export const renderArchitecture = () =>
  layout(
    "FoodNow architecture",
    `
    <h1>Architecture &amp; diagrams</h1>
    <p class="muted">Start at the top and read down: structure, request flow, data model, then the key use cases.</p>
    <section><h2>Folder structure</h2><pre>${escapeHtml(FOLDER_TREE)}</pre></section>
    ${Object.entries(diagrams)
      .map(
        ([name, d]) => `
    <section id="${name}">
      <h2>${d.title}</h2>
      <p class="muted">${d.description}</p>
      <pre class="mermaid">${escapeHtml(d.code)}</pre>
      <p><a href="/doc/diagrams/${name}">raw Mermaid source</a></p>
    </section>`
      )
      .join("")}`,
    MERMAID_SCRIPT
  );

const code = (text) => `<pre>${escapeHtml(text.trim())}</pre>`;

export const renderGuide = () =>
  layout(
    "FoodNow getting started",
    `
    <h1>Getting started with FoodNow</h1>
    <p class="muted">A small food-delivery backend: browse restaurants, see menus, place an order, track its status.
    Stack: Node.js 20+, Express 5, PostgreSQL.</p>

    <section><h2>1. Get the code</h2>
      <p><b>Prerequisites:</b> Git, Node.js 20.6+ (for <code>--env-file</code>) and a running PostgreSQL.</p>
      ${code(`git clone https://github.com/mohamedessamcs96/GIU-Foodnow.git
cd GIU-Foodnow`)}
    </section>

    <section><h2>2. Setup</h2>
      ${code(`npm install
cp .env.example .env     # then edit DATABASE_URL with your Postgres password`)}
      <p>Create the database and load the tables and sample data:</p>
      ${code(`createdb foodnow_db
psql -d foodnow_db -f sql/schema.sql   # tables (drops existing ones!)
psql -d foodnow_db -f sql/seed.sql     # sample restaurants and menus`)}
      <p>Start the server (auto-restarts on file changes):</p>
      ${code("npm run dev")}
      <p>Open <code>http://localhost:3000/health</code>. You should see <code>{"status":"ok"}</code>. The live docs are at <code>http://localhost:3000/doc/guide</code>.</p>
    </section>

    <section><h2>Environment variables (.env)</h2>
      <table>
        <tr><th>Name</th><th>Required</th><th>Meaning</th></tr>
        <tr><td><code>DATABASE_URL</code></td><td>yes</td><td>Postgres connection string. The app refuses to start without it.</td></tr>
        <tr><td><code>PORT</code></td><td>no (3000)</td><td>Port to listen on.</td></tr>
        <tr><td><code>CORS_ORIGINS</code></td><td>no</td><td>Comma-separated browser origins allowed to call the API. Empty = allow all (dev only).</td></tr>
      </table>
    </section>

    <section><h2>3. Try it</h2>
      ${code(`curl "http://localhost:3000/api/v1/restaurants?open=true"
curl http://localhost:3000/api/v1/restaurants/1/menu

curl -X POST http://localhost:3000/api/v1/orders \\
  -H "Content-Type: application/json" \\
  -d '{"restaurantId":1,"customerName":"Sara","address":"12 Tahrir St, Giza",
       "items":[{"menuItemId":1,"quantity":2},{"menuItemId":3,"quantity":1}]}'

curl -X PATCH http://localhost:3000/api/v1/orders/1/status \\
  -H "Content-Type: application/json" -d '{"status":"preparing"}'`)}
      <p>Total = sum of (price x quantity) + the restaurant's delivery fee. Prices always come from the database, never from the client.</p>
    </section>

    <section><h2>4. How a request flows</h2>
      <ol>
        <li><b>Global middleware</b> (<code>app.js</code>): helmet (secure headers), cors, morgan (logging), JSON body parser, static files, rate limiter on <code>/api/v1</code>.</li>
        <li><b>Route</b> (<code>routes/</code>): matches the URL and runs validation middleware (<code>validate</code>, <code>validateId</code>). Bad input stops here with 400.</li>
        <li><b>Controller</b> (<code>controllers/</code>): reads <code>req</code>, calls one service function, sends the response.</li>
        <li><b>Service</b> (<code>services/</code>): business rules and SQL. Throws <code>AppError</code> when a rule fails.</li>
        <li><b>Database</b> (<code>db.js</code>): connection pool; <code>withTransaction</code> makes multi-step writes all-or-nothing.</li>
        <li><b>Error handler</b>: turns any <code>AppError</code> into a JSON response with the right status code; unknown errors become a safe 500.</li>
      </ol>
      <p>See the <a href="/doc/architecture">diagrams</a> for the visual version, including the ERD and sequence diagrams.</p>
    </section>

    <section><h2>5. Where to find things</h2>
      <table>
        <tr><th>I want to...</th><th>Look in</th></tr>
        <tr><td>add or change a URL</td><td><code>src/routes/</code></td></tr>
        <tr><td>change what a request must contain</td><td><code>src/middleware/validate.js</code> and the route file</td></tr>
        <tr><td>change a business rule (e.g. allowed status changes)</td><td><code>src/services/</code>, <code>src/constants/orderStatus.js</code></td></tr>
        <tr><td>change the database</td><td><code>sql/schema.sql</code></td></tr>
        <tr><td>add a setting</td><td><code>src/config/env.js</code> and <code>.env.example</code></td></tr>
        <tr><td>update these docs</td><td><code>src/docs/</code></td></tr>
      </table>
    </section>

    <section><h2>6. Key ideas used in the code</h2>
      <ul>
        <li><b>Layers:</b> each layer has one job, so a change touches few files.</li>
        <li><b>Higher-order functions:</b> <code>asyncHandler</code>, <code>validate(rules)</code>, <code>withTransaction(work)</code> take or return functions.</li>
        <li><b>Transactions:</b> creating an order saves the order and its items together, or nothing.</li>
        <li><b>Price snapshot:</b> <code>order_items.unit_price</code> copies the price at order time so later menu edits don't change old orders.</li>
        <li><b>Parameterized SQL:</b> values go in <code>$1, $2</code>, never string-concatenated, which prevents SQL injection.</li>
        <li><b>State machine:</b> order status can only move along allowed steps.</li>
      </ul>
    </section>

    <section><h2>7. HTTP status codes used</h2>
      <table>
        <tr><th>Code</th><th>When</th></tr>
        <tr><td>200 / 201</td><td>Success / order created</td></tr>
        <tr><td>400</td><td>Invalid body or id, closed restaurant, unavailable item</td></tr>
        <tr><td>404</td><td>Restaurant, order or route not found</td></tr>
        <tr><td>409</td><td>Order status change not allowed</td></tr>
        <tr><td>429</td><td>Rate limit exceeded</td></tr>
        <tr><td>500</td><td>Unexpected error (details only in server logs)</td></tr>
      </table>
    </section>

    <section><h2>8. Troubleshooting</h2>
      <ul>
        <li><b>"Missing required environment variable: DATABASE_URL"</b>: you didn't create <code>.env</code>.</li>
        <li><b>"Could not connect to the database"</b>: Postgres isn't running, or the password or database name in <code>DATABASE_URL</code> is wrong.</li>
        <li><b>Empty restaurant list</b>: run <code>sql/seed.sql</code>.</li>
        <li><b>Diagrams don't show</b>: the page loads Mermaid from a CDN, so it needs internet access.</li>
      </ul>
    </section>

    <section><h2>9. Ideas to extend it</h2>
      <ul><li>Users and JWT login, linking orders to a user</li><li>Pagination on the restaurant list</li><li>Automated tests (supertest)</li><li>Dockerfile</li><li>Restaurant image upload with multer</li></ul>
    </section>`
  );
