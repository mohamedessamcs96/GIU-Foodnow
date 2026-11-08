# FoodNow-style Food Delivery API

Node.js + Express + PostgreSQL. Mini version of a food-delivery backend:
browse restaurants, see menus, place an order, track its status.

## Setup

```bash
npm install
cp .env.example .env        # then put your real Postgres password in DATABASE_URL
```

Create the database in pgAdmin (or `createdb foodnow_db`), then run the SQL:

```bash
psql -U postgres -d foodnow_db -f sql/schema.sql
psql -U postgres -d foodnow_db -f sql/seed.sql
```

Start the server:

```bash
npm run dev
```

## Endpoints

| Method | Path                              | Description                              |
|--------|-----------------------------------|------------------------------------------|
| GET    | /health                           | Health check                             |
| GET    | /doc                              | API documentation                       |
| GET    | /api/v1/restaurants               | List (filters: `?cuisine=italian&open=true`) |
| GET    | /api/v1/restaurants/:id           | One restaurant                           |
| GET    | /api/v1/restaurants/:id/menu      | Available menu items                     |
| POST   | /api/v1/orders                    | Place an order                           |
| GET    | /api/v1/orders/:id                | Order with its items                     |
| PATCH  | /api/v1/orders/:id/status         | Update order status                      |

## Try it with curl

```bash
curl "http://localhost:3000/api/v1/restaurants?open=true"
curl http://localhost:3000/api/v1/restaurants/1/menu

curl -X POST http://localhost:3000/api/v1/orders \
  -H "Content-Type: application/json" \
  -d '{
    "restaurantId": 1,
    "customerName": "Sara",
    "address": "12 Tahrir St, Giza",
    "items": [ { "menuItemId": 1, "quantity": 2 }, { "menuItemId": 3, "quantity": 1 } ]
  }'

curl -X PATCH http://localhost:3000/api/v1/orders/1/status \
  -H "Content-Type: application/json" -d '{"status":"preparing"}'
```

Expected total for that order: (45 x 2) + 25 + 15 delivery = **130**.

## Where the concepts are used

**async / await**: every service function (`orders.service.js`, `restaurants.service.js`) and every controller.

**Higher-order functions** (functions that take or return functions):
- `asyncHandler(fn)`: wraps a handler and forwards errors to Express
- `validate(rules)` and `validateId()`: middleware factories
- `isOneOf([...])`: builds a validation rule
- `withTransaction(work)`: runs any async work inside BEGIN / COMMIT / ROLLBACK
- `withNumbers(...fields)`: builds a row mapper
- `map`, `filter`, `reduce`, `every` for totals and validation

## Ideas to extend it
1. Add `users` + JWT login (see slides 59-62) and link orders to `user_id`
2. Add pagination to `GET /restaurants` (slide 33)
3. Add supertest tests (slide 69)
4. Add a `Dockerfile` (slide 70)
