// Mermaid diagram sources. Plain strings so they can be rendered in the browser
// (/doc/architecture) or fetched as text (/doc/diagrams/:name) and pasted into any Mermaid tool.
import { STATUS_TRANSITIONS } from "../constants/orderStatus.js";

// The state diagram is BUILT from STATUS_TRANSITIONS: each "from -> to" pair becomes
// one line, and statuses with no way out point to [*] (the end marker).
const statusDiagram = [
  "stateDiagram-v2",
  "  [*] --> pending",
  ...Object.entries(STATUS_TRANSITIONS).flatMap(([from, targets]) => [
    ...targets.map((to) => `  ${from} --> ${to}`),
    ...(targets.length === 0 ? [`  ${from} --> [*]`] : []),
  ]),
].join("\n");

// Every diagram: { title, description, code }. The object key is its URL name,
// e.g. /doc/diagrams/erd. Add a new entry here and it shows up everywhere.
export const diagrams = {
  structure: {
    title: "1. Project structure (layers)",
    description:
      "Each layer has one job and only talks to the layer below it. Routes never touch the database; services never touch req/res.",
    code: `flowchart TB
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
  Err -. JSON error .-> Client`,
  },

  flow: {
    title: "2. Request lifecycle (flowchart)",
    description: "What happens to every request, including the failure paths.",
    code: `flowchart TD
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
  ERR --> R[Error JSON to client]`,
  },

  erd: {
    title: "3. Database ERD",
    description:
      "unit_price is copied into order_items on purpose: later menu price changes must not change old orders.",
    code: `erDiagram
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
  }`,
  },

  "sequence-create-order": {
    title: "4. Sequence: POST /api/v1/orders",
    description: "The most important flow. Everything inside the transaction succeeds or nothing is saved.",
    code: `sequenceDiagram
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
  K-->>C: 201 Created {order}`,
  },

  "sequence-update-status": {
    title: "5. Sequence: PATCH /api/v1/orders/:id/status",
    description: "Row is locked while the transition rule is checked, so concurrent updates cannot corrupt the status.",
    code: `sequenceDiagram
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
  end`,
  },

  "order-status": {
    title: "6. Order status state machine",
    description: "Generated from src/constants/orderStatus.js, so it can never drift from the code.",
    code: statusDiagram,
  },
};
