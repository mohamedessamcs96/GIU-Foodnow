# FoodNow API 🍔

A food-delivery backend built with **Node.js, Express 5 and PostgreSQL**. Customers can browse restaurants and menus, place orders and track their status. Restaurants and menus can be managed through the API.

This guide takes you from **zero** (installing Node.js) to a **running API**, then explains how the code is organised, with diagrams.

## Table of contents

1. [What you will build](#1-what-you-will-build)
2. [Install the tools](#2-install-the-tools)
3. [Get the project](#3-get-the-project)
4. [Install dependencies](#4-install-dependencies-how-express-gets-installed)
5. [Configure the environment](#5-configure-the-environment-env)
6. [Create the database](#6-create-the-database)
7. [Run it in VS Code](#7-run-it-in-vs-code)
8. [Try the API](#8-try-the-api)
9. [Built-in documentation pages](#9-built-in-documentation-pages)
10. [Architecture and diagrams](#10-architecture-and-diagrams)
11. [Project structure](#11-project-structure)
12. [API reference](#12-api-reference)
13. [Middleware used](#13-middleware-used)
14. [Key concepts](#14-key-concepts-in-the-code)
15. [Deploy the docs site on Vercel](#15-deploy-the-docs-site-on-vercel)
16. [Troubleshooting](#16-troubleshooting)
17. [Ideas to extend it](#17-ideas-to-extend-it)

---

## 1. What you will build

| Feature | Endpoints |
|---|---|
| Browse and search restaurants | `GET /restaurants`, `GET /restaurants/:id` |
| See a menu | `GET /restaurants/:id/menu` |
| Place and track orders | `POST /orders`, `GET /orders`, `GET /orders/:id` |
| Move an order along its life cycle | `PATCH /orders/:id/status`, `POST /orders/:id/cancel` |
| Manage restaurants and menus | `POST/PATCH/DELETE /restaurants`, `POST /restaurants/:id/menu`, `PATCH /menu-items/:id` |

**Tech stack:** Node.js 20.6+ · Express 5 · PostgreSQL · `pg` · helmet · cors · morgan · express-rate-limit.

---

## 2. Install the tools

You need four things: **Node.js**, **Git**, **PostgreSQL** and **VS Code**.

### 2.1 Node.js (includes npm)

Node.js runs JavaScript outside the browser. **npm** (installed with it) downloads libraries such as Express. This project needs **Node.js 20.6 or newer** (it uses the `--env-file` flag).

- **Windows / macOS:** download the **LTS** installer from <https://nodejs.org> and run it (keep the default options).
- **macOS with Homebrew:** `brew install node`
- **Linux / macOS (version manager):**
  ```bash
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  # restart the terminal, then:
  nvm install --lts
  ```

Check it worked (open a **new** terminal):

```bash
node -v    # should print v20.6.0 or higher
npm -v     # should print a version number
```

### 2.2 Git

- Windows: <https://git-scm.com/download/win> · macOS: `brew install git` (or install Xcode tools) · Ubuntu: `sudo apt install git`
- Check: `git --version`

### 2.3 PostgreSQL

The database that stores restaurants, menus and orders.

- **Windows:** installer from <https://www.postgresql.org/download/windows/>. Remember the password you set for the `postgres` user. Keep port `5432`.
- **macOS:** `brew install postgresql@16` then `brew services start postgresql@16`
- **Ubuntu:** `sudo apt install postgresql` then `sudo systemctl start postgresql`
- Check: `psql --version` and `pg_isready` (should say "accepting connections").

> Optional: **pgAdmin** (a graphical tool, included in the Windows installer) lets you browse the tables.

### 2.4 VS Code

Download from <https://code.visualstudio.com>. Recommended extensions (Extensions panel, `Ctrl+Shift+X`):

- **REST Client** (humao.rest-client) or **Thunder Client**: send API requests from inside VS Code.
- **PostgreSQL** (optional): browse the database from VS Code.
- **Markdown Preview Mermaid Support** (optional): shows the diagrams in this README inside VS Code.

---

## 3. Get the project

```bash
git clone https://github.com/mohamedessamcs96/GIU-Foodnow.git
cd GIU-Foodnow
```

---

## 4. Install dependencies (how Express gets installed)

Every Node project lists its libraries in **`package.json`**. To install them all:

```bash
npm install
```

This creates the `node_modules/` folder (never commit it, it is in `.gitignore`).

**How the libraries were originally added** (useful when starting your own project):

```bash
npm init -y                 # creates package.json
npm install express         # the web framework
npm install pg              # PostgreSQL driver
npm install cors helmet morgan express-rate-limit
```

`"type": "module"` in `package.json` lets us write `import ... from ...` instead of `require(...)`.

---

## 5. Configure the environment (.env)

Secrets and settings live in a `.env` file that is **not** committed. Copy the example:

```bash
cp .env.example .env          # Windows PowerShell: copy .env.example .env
```

Open `.env` in VS Code and edit it:

```ini
PORT=3000
DATABASE_URL=postgres://postgres:your_password@localhost:5432/foodnow_db
CORS_ORIGINS=http://localhost:5173
```

| Variable | Required | Meaning |
|---|---|---|
| `DATABASE_URL` | yes | `postgres://USER:PASSWORD@HOST:PORT/DATABASE`. The app refuses to start without it. |
| `PORT` | no (3000) | Port the API listens on. |
| `CORS_ORIGINS` | no | Comma-separated browser origins allowed to call the API. Empty means all (development only). |

> **macOS Homebrew users:** the default database user is your **Mac username** with no password, e.g. `postgres://yourname@localhost:5432/foodnow_db`.

---

## 6. Create the database

```bash
createdb foodnow_db                              # 1. create an empty database
psql -d foodnow_db -f sql/schema.sql             # 2. create the tables
psql -d foodnow_db -f sql/seed.sql               # 3. add sample restaurants and menus
```

If your Postgres user is `postgres`, add `-U postgres` to each command (Windows users can also run the two `.sql` files in pgAdmin's Query Tool).

> ⚠️ `schema.sql` **drops and recreates** the tables, so running it again erases all data.

---

## 7. Run it in VS Code

1. Start VS Code, then **File → Open Folder…** and choose the `GIU-Foodnow` folder.
2. Open the terminal: **Terminal → New Terminal** (`` Ctrl+` ``).
3. Start the server:

   ```bash
   npm run dev
   ```

   You should see:

   ```
   Database connected at 2026-...
   FoodNow API running at http://localhost:3000  (docs: /doc)
   ```

4. Open <http://localhost:3000/health>. You should see `{"status":"ok"}`. 🎉

| Script | What it does |
|---|---|
| `npm run dev` | Starts the server and **restarts automatically** when you save a file (use while coding). |
| `npm start` | Starts the server once (use in production). |
| `npm run docs:build` | Regenerates the static docs site in `docs-site/`. |

Stop the server with `Ctrl+C`.

---

## 8. Try the API

### Option A: curl (terminal)

```bash
# list open restaurants
curl "http://localhost:3000/api/v1/restaurants?open=true"

# see a menu
curl http://localhost:3000/api/v1/restaurants/1/menu

# place an order
curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "customerName": "Sara",
    "address": "12 Tahrir St, Giza",
    "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 3, "quantity": 1 } ]
  }'

# move it forward
curl -X PATCH http://localhost:3000/api/v1/orders/1/status \
  -H "Content-Type: application/json" -d '{"status":"preparing"}'
```

Expected total for that order: `(45 × 2) + 25 + 15 delivery = 130`.

### Option B: VS Code REST Client

Create a file `requests.http`, then click **Send Request** above each block:

```http
### List restaurants
GET http://localhost:3000/api/v1/restaurants

### Create an order
POST http://localhost:3000/api/v1/orders
Content-Type: application/json

{
  "restaurantId": 1,
  "customerName": "Sara",
  "address": "12 Tahrir St, Giza",
  "items": [{ "menuItemId": 1, "quantity": 2 }]
}
```

### Option C: Postman or a browser

`GET` requests can simply be opened in the browser. For `POST`/`PATCH`, use Postman or Thunder Client.

---

## 9. Built-in documentation pages

When the server is running:

| URL | Content |
|---|---|
| <http://localhost:3000/> | Landing page |
| <http://localhost:3000/doc/guide> | Setup guide and request flow |
| <http://localhost:3000/doc/architecture> | All diagrams, rendered |
| <http://localhost:3000/doc> | API reference |
| <http://localhost:3000/doc/diagrams> | Diagrams as JSON (Mermaid source) |
| <http://localhost:3000/doc/diagrams/erd> | One diagram as raw Mermaid text |

---

## 10. Architecture and diagrams

### 1. Project structure (layers)

Each layer has one job and only talks to the layer below it. Routes never touch the database; services never touch req/res.

```mermaid
flowchart TB
  Client([Client / curl / mobile app])
  subgraph Express["Express app (src/app.js)"]
    MW["Global middleware<br/>helmet, cors, morgan, json parser"]
    Routes["Routes (src/routes)<br/>URL + validation + which controller"]
    Val["Validation middleware<br/>(src/middleware/validate.js)"]
    Ctrl["Controllers (src/controllers)<br/>read req, call service, send res"]
    Svc["Services (src/services)<br/>business rules + SQL"]
    Err["Error handler<br/>(src/middleware/errorHandler.js)"]
  end
  DB[("PostgreSQL<br/>src/db.js pool")]
  Client --> MW --> Routes --> Val --> Ctrl --> Svc --> DB
  Val -. AppError .-> Err
  Svc -. AppError .-> Err
  Err -. JSON error .-> Client
```

### 2. Request lifecycle (flowchart)

What happens to every request, including the failure paths.

```mermaid
flowchart TD
  A[Request arrives] --> B{Route matches?}
  B -- no --> NF[notFound -> 404]
  B -- yes --> C{Validation passes?}
  C -- no --> V[AppError 400 + details]
  C -- yes --> D[Controller calls service]
  D --> E{Business rules OK?}
  E -- no --> F[AppError 400 / 404 / 409]
  E -- yes --> G[SQL query / transaction]
  G --> H[Response JSON 200 / 201]
  NF --> ERR[errorHandler]
  V --> ERR
  F --> ERR
  ERR --> R[Error JSON to client]
```

### 3. Database ERD

unit_price is copied into order_items on purpose: later menu price changes must not change old orders.

```mermaid
erDiagram
  RESTAURANTS ||--o{ MENU_ITEMS : "has"
  RESTAURANTS ||--o{ ORDERS : "receives"
  ORDERS ||--|{ ORDER_ITEMS : "contains"
  MENU_ITEMS ||--o{ ORDER_ITEMS : "ordered as"

  RESTAURANTS {
    serial id PK
    varchar name
    varchar cuisine
    numeric delivery_fee
    boolean is_open
  }
  MENU_ITEMS {
    serial id PK
    int restaurant_id FK
    varchar name
    numeric price "CHECK >= 0"
    boolean is_available
  }
  ORDERS {
    serial id PK
    int restaurant_id FK
    varchar customer_name
    text address
    varchar status "pending|preparing|on_the_way|delivered|cancelled"
    numeric total
    timestamptz created_at
  }
  ORDER_ITEMS {
    serial id PK
    int order_id FK
    int menu_item_id FK
    int quantity "CHECK > 0"
    numeric unit_price "price snapshot"
  }
```

### 4. Sequence: POST /api/v1/orders

The most important flow. Everything inside the transaction succeeds or nothing is saved.

```mermaid
sequenceDiagram
  autonumber
  actor C as Client
  participant R as Route + validate()
  participant K as Controller
  participant S as orders.service
  participant DB as PostgreSQL
  C->>R: POST /orders {restaurantId, customerName, address, items}
  alt invalid body
    R-->>C: 400 Validation failed
  end
  R->>K: create(req, res)
  K->>S: createOrder(body)
  S->>DB: BEGIN
  S->>DB: SELECT restaurant
  alt missing or closed
    S->>DB: ROLLBACK
    S-->>C: 404 / 400 (via errorHandler)
  end
  S->>DB: SELECT prices of requested items (available, this restaurant)
  Note over S: Prices come from the DB, never from the client
  alt some item invalid
    S->>DB: ROLLBACK
    S-->>C: 400 with menuItemIds
  end
  Note over S: total = sum(price x qty) + delivery_fee
  S->>DB: INSERT order
  S->>DB: INSERT order_items (bulk)
  S->>DB: COMMIT
  S->>DB: SELECT order + items
  S-->>K: order
  K-->>C: 201 Created {order}
```

### 5. Sequence: PATCH /api/v1/orders/:id/status

Row is locked while the transition rule is checked, so concurrent updates cannot corrupt the status.

```mermaid
sequenceDiagram
  autonumber
  actor C as Client
  participant K as Controller
  participant S as orders.service
  participant DB as PostgreSQL
  C->>K: PATCH /orders/7/status {status}
  K->>S: updateStatus(7, status)
  S->>DB: BEGIN
  S->>DB: SELECT status FROM orders WHERE id=7 FOR UPDATE
  alt not found
    S-->>C: 404
  else transition not allowed
    S->>DB: ROLLBACK
    S-->>C: 409 Conflict {allowed: [...]}
  else allowed
    S->>DB: UPDATE orders SET status
    S->>DB: COMMIT
    S-->>C: 200 {order}
  end
```

### 6. Order status state machine

Generated from src/constants/orderStatus.js, so it can never drift from the code.

```mermaid
stateDiagram-v2
  [*] --> pending
  pending --> preparing
  pending --> cancelled
  preparing --> on_the_way
  preparing --> cancelled
  on_the_way --> delivered
  delivered --> [*]
  cancelled --> [*]
```

---

## 11. Project structure

```
food-now/
├─ sql/
│  ├─ schema.sql             tables, constraints, indexes (drops and recreates!)
│  └─ seed.sql               sample restaurants and menu items
├─ public/
│  └─ index.html             landing page (served by express.static)
├─ scripts/
│  └─ build-docs-site.js     generates the static docs-site/ folder
├─ docs-site/                static copy of the docs (deploy this on Vercel)
├─ src/
│  ├─ server.js              ENTRY POINT: check DB, listen, graceful shutdown
│  ├─ app.js                 builds Express: middleware + routes + error handling
│  ├─ db.js                  pg connection pool + withTransaction()
│  ├─ config/env.js          reads and validates environment variables
│  ├─ constants/             order statuses and allowed transitions
│  ├─ routes/                URL -> validation -> controller
│  ├─ controllers/           HTTP in/out only (no SQL, no business rules)
│  ├─ services/              business rules + SQL
│  ├─ middleware/            validate.js, errorHandler.js
│  ├─ utils/                 AppError, asyncHandler, money and SQL helpers
│  └─ docs/                  diagram sources + HTML pages for /doc
├─ .env.example              template for your .env
└─ package.json              dependencies and scripts
```

**Rule of thumb:** a request flows `route → validation → controller → service → database`. Each layer has one job.

| I want to… | Look in |
|---|---|
| add or change a URL | `src/routes/` |
| change input checks | `src/middleware/validate.js` + the route file |
| change a business rule | `src/services/`, `src/constants/` |
| change the database | `sql/schema.sql` |
| add a setting | `src/config/env.js` + `.env.example` |

---

## 12. API reference

Base path: `/api/v1`. All bodies and responses are JSON.

### Restaurants

| Method | Path | Description |
|---|---|---|
| GET | `/restaurants` | List. Query: `cuisine`, `open=true`, `q` (name contains) |
| GET | `/restaurants/:id` | One restaurant |
| POST | `/restaurants` | Create: `{ name, cuisine, deliveryFee?, isOpen? }` → 201 |
| PATCH | `/restaurants/:id` | Update any of `name, cuisine, deliveryFee, isOpen` |
| DELETE | `/restaurants/:id` | Delete → 204 (409 if it has orders) |

### Menu

| Method | Path | Description |
|---|---|---|
| GET | `/restaurants/:id/menu` | Available dishes |
| POST | `/restaurants/:id/menu` | Add a dish: `{ name, price, isAvailable? }` → 201 |
| PATCH | `/menu-items/:id` | Update `name`, `price`, `isAvailable` |

### Orders

| Method | Path | Description |
|---|---|---|
| GET | `/orders` | List, newest first. Query: `status`, `restaurantId`, `limit` (max 100), `offset` |
| POST | `/orders` | Place an order → 201 |
| GET | `/orders/:id` | Order with its items |
| PATCH | `/orders/:id/status` | Change status `{ "status": "preparing" }` (follows the state diagram) |
| POST | `/orders/:id/cancel` | Cancel (only `pending` / `preparing`) |

Other: `GET /health` → `{ "status": "ok" }`.

**Example: create an order**

Request:
```json
{
  "restaurantId": 1,
  "customerName": "Sara",
  "address": "12 Tahrir St, Giza",
  "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 3, "quantity": 1 } ]
}
```

Response `201`:
```json
{
  "id": 1,
  "restaurant_name": "Koshary El Tahrir",
  "customer_name": "Sara",
  "status": "pending",
  "total": 130,
  "subtotal": 115,
  "deliveryFee": 15,
  "items": [
    { "menu_item_id": 1, "name": "Koshary Medium", "quantity": 2, "unit_price": 45 },
    { "menu_item_id": 3, "name": "Rice Pudding", "quantity": 1, "unit_price": 25 }
  ]
}
```

### Errors

Every error has the same shape:

```json
{ "error": "Validation failed", "details": ["customerName: must be a non-empty string"] }
```

| Code | When |
|---|---|
| 200 / 201 / 204 | Success / created / deleted |
| 400 | Invalid body, query or id; closed restaurant; unavailable item |
| 404 | Restaurant, menu item, order or route not found |
| 409 | Order status change not allowed, or deleting a restaurant that has orders |
| 429 | Rate limit exceeded (100 requests per minute per IP) |
| 500 | Unexpected error (details are only in the server log) |

> This API has **no authentication** yet, so anyone can edit or delete data. Add login before using it for real.

---

## 13. Middleware used

Middleware = functions that run on every request, in order, before your route code.

| Middleware | Purpose | Install |
|---|---|---|
| `express.json()` | Parses JSON bodies into `req.body` | built in |
| `express.static()` | Serves files such as HTML, CSS, images (`public/`) | built in |
| `cors` | Allows trusted browser origins to call the API | `npm i cors` |
| `helmet` | Sets secure HTTP response headers | `npm i helmet` |
| `morgan` | Logs every incoming request | `npm i morgan` |
| `express-rate-limit` | Limits how often a client can call | `npm i express-rate-limit` |
| `multer` | Handles file uploads (not used yet) | `npm i multer` |

---

## 14. Key concepts in the code

- **Layers:** each layer has one job, so changes touch few files.
- **Higher-order functions** (functions that take or return functions): `asyncHandler(fn)`, `validate(rules)`, `validateId()`, `optional(check)`, `isOneOf([...])`, `withTransaction(work)`, `withNumbers(...)`.
- **Transactions:** creating an order saves the order and its items together, or nothing at all.
- **Price snapshot:** `order_items.unit_price` copies the price at order time, so later menu edits never change old orders.
- **Never trust the client:** prices are always loaded from the database.
- **Parameterized SQL:** values go in `$1, $2`, never concatenated into the query (prevents SQL injection).
- **State machine:** order status can only follow allowed steps (`src/constants/orderStatus.js`).
- **Row locking:** `SELECT ... FOR UPDATE` stops two requests changing the same order at once.
- **Centralised errors:** services throw `AppError`; one error handler formats every response.

---

## 15. Deploy the docs site on Vercel

`docs-site/` is a standalone copy of the documentation (no server or database needed).

```bash
npm run docs:build     # regenerate after editing src/docs/
```

In Vercel: **Add New Project → import the repo → Root Directory = `docs-site` → Framework Preset = Other → Deploy.**

> The API itself needs a Node server and a PostgreSQL database, so host it on a platform such as Render, Railway or Fly.io with a managed Postgres.

---

## 16. Troubleshooting

| Problem | Fix |
|---|---|
| `node: command not found` | Install Node.js, then open a **new** terminal. |
| `Missing required environment variable: DATABASE_URL` | You did not create `.env` (step 5). |
| `Could not connect to the database` | Postgres is not running, or the user, password or database name in `DATABASE_URL` is wrong. Check with `pg_isready`. |
| `database "foodnow_db" does not exist` | Run `createdb foodnow_db`. |
| `relation "restaurants" does not exist` | Run `sql/schema.sql` (step 6). |
| Empty restaurant list | Run `sql/seed.sql`. |
| `EADDRINUSE: address already in use` | Another program uses the port. Change `PORT` in `.env`. |
| `429 Too many requests` | You exceeded 100 requests per minute. Wait a minute. |
| Diagrams do not render | GitHub renders them automatically. Locally, the `/doc/architecture` page needs internet access (it loads Mermaid from a CDN). |

---

## 17. Ideas to extend it

1. Users and JWT login, linking orders to a user
2. Pagination on the restaurant list
3. Automated tests (supertest)
4. A `Dockerfile`
5. Restaurant image upload with `multer`
