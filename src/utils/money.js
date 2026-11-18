// ============================================================================
// utils/money.js  -  small helpers for money values.
// ============================================================================

// JavaScript floats are inexact (0.1 + 0.2 = 0.30000000000000004), so we round
// money to 2 decimals after calculating.
export const round2 = (n) => Math.round(n * 100) / 100;

// The pg driver returns NUMERIC columns (price, total...) as STRINGS like
// "45.00", because JS numbers could lose precision for huge values. Our values
// are small, so we convert them to real numbers for the JSON response.
//
// HIGHER-ORDER FUNCTION: withNumbers("price") RETURNS a function that converts
// the "price" field of any row:
//
//   const toMenuItem = withNumbers("price");
//   toMenuItem({ id: 1, price: "45.00" })  -->  { id: 1, price: 45 }
export const withNumbers = (...fields) => (row) =>
  // reduce walks the field names, rebuilding the row with each field converted.
  // `{ ...acc, [f]: Number(row[f]) }` = copy acc, then overwrite field f.
  fields.reduce((acc, f) => ({ ...acc, [f]: Number(row[f]) }), row);
