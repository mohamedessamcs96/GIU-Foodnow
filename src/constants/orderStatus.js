// ============================================================================
// constants/orderStatus.js  -  single source of truth for order statuses.
//
// Three different places need this information:
//   * the route validation  (is the status the client sent a real one?)
//   * the order service     (is this status change allowed right now?)
//   * the docs diagram      (draw the state machine)
// Keeping it here means we change it in ONE place and everything stays in sync.
// (The database CHECK constraint in sql/schema.sql must list the same values.)
// ============================================================================

// Every status an order can have.
export const ORDER_STATUSES = ["pending", "preparing", "on_the_way", "delivered", "cancelled"];

// A "state machine": for each status, which statuses may come NEXT.
//
//   pending -> preparing -> on_the_way -> delivered
//      \           \
//       +-----------+--> cancelled
//
// An empty array means it is a FINAL state: nothing can follow it.
export const STATUS_TRANSITIONS = {
  pending: ["preparing", "cancelled"],
  preparing: ["on_the_way", "cancelled"],
  on_the_way: ["delivered"],
  delivered: [],
  cancelled: [],
};
