import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.type("html").send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>FoodNow API documentation</title>
    <style>
      :root { color-scheme: light; font: 16px/1.6 system-ui, sans-serif; color: #17212b; background: #f4f7f9; }
      body { max-width: 960px; margin: 0 auto; padding: 2rem 1.25rem 4rem; }
      h1, h2 { line-height: 1.2; }
      h1 { margin-bottom: .25rem; }
      h2 { margin-top: 2.5rem; }
      .muted { color: #526170; }
      section, .endpoint { background: white; border: 1px solid #dce3e8; border-radius: 8px; padding: 1rem 1.25rem; margin: 1rem 0; }
      .endpoint h3 { margin: 0 0 .5rem; }
      code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      pre { overflow-x: auto; padding: 1rem; border-radius: 6px; background: #17212b; color: #f4f7f9; }
      .method { display: inline-block; min-width: 4.5rem; font-weight: 700; color: #075e54; }
      dt { font-weight: 700; }
      dd { margin: 0 0 .75rem; }
      @media (max-width: 600px) { body { padding: 1rem .75rem 3rem; } }
    </style>
  </head>
  <body>
    <h1>FoodNow API</h1>
    <p class="muted">Version 1 · Base path: <code>/api/v1</code></p>
    <p>Browse restaurants and menus, place orders, and track order status. All responses are JSON except this documentation page.</p>

    <h2>Health and documentation</h2>
    <div class="endpoint"><h3><span class="method">GET</span><code>/health</code></h3><p>Checks whether the API process is responding.</p><pre>{"status":"ok"}</pre></div>
    <div class="endpoint"><h3><span class="method">GET</span><code>/doc</code></h3><p>Displays this API reference.</p></div>

    <h2>Restaurants</h2>
    <div class="endpoint">
      <h3><span class="method">GET</span><code>/api/v1/restaurants</code></h3>
      <p>Lists restaurants. Optional query parameters: <code>cuisine</code> (case-insensitive) and <code>open=true</code>.</p>
      <p>Response: <code>{ total, data }</code>, where <code>data</code> is an array of restaurants.</p>
    </div>
    <div class="endpoint">
      <h3><span class="method">GET</span><code>/api/v1/restaurants/:id</code></h3>
      <p>Gets one restaurant by its positive integer ID. Returns 404 if it does not exist.</p>
    </div>
    <div class="endpoint">
      <h3><span class="method">GET</span><code>/api/v1/restaurants/:id/menu</code></h3>
      <p>Lists available menu items for a restaurant. Response: <code>{ data }</code>. Returns 404 if the restaurant does not exist.</p>
    </div>

    <h2>Orders</h2>
    <div class="endpoint">
      <h3><span class="method">POST</span><code>/api/v1/orders</code></h3>
      <p>Places an order at an open restaurant. Prices are calculated by the API from the current menu.</p>
      <p>Request body (<code>Content-Type: application/json</code>):</p>
      <pre>{
  "restaurantId": 1,
  "customerName": "Sara",
  "address": "12 Tahrir St, Giza",
  "items": [
    { "menuItemId": 1, "quantity": 2 },
    { "menuItemId": 3, "quantity": 1 }
  ]
}</pre>
      <p>Each item needs a positive integer <code>menuItemId</code> and <code>quantity</code>. Returns the created order with HTTP 201. Closed restaurants or unavailable items return HTTP 400.</p>
    </div>
    <div class="endpoint">
      <h3><span class="method">GET</span><code>/api/v1/orders/:id</code></h3>
      <p>Gets an order, including its items. Returns 404 if it does not exist.</p>
    </div>
    <div class="endpoint">
      <h3><span class="method">PATCH</span><code>/api/v1/orders/:id/status</code></h3>
      <p>Updates an order status. Request body:</p>
      <pre>{ "status": "preparing" }</pre>
      <p>Allowed statuses: <code>pending</code>, <code>preparing</code>, <code>on_the_way</code>, <code>delivered</code>, <code>cancelled</code>.</p>
    </div>

    <h2>Errors</h2>
    <p>Errors use a JSON object with an <code>error</code> message. Validation and other details may be included in <code>details</code>.</p>
    <pre>{ "error": "Validation failed", "details": ["customerName: must be a non-empty string"] }</pre>
  </body>
</html>`);
});

export default router;
