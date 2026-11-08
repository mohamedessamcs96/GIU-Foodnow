// pg returns NUMERIC columns as strings, so convert them to numbers.
export const round2 = (n) => Math.round(n * 100) / 100;

// HIGHER-ORDER FUNCTION: returns a mapper that converts the given fields.
export const withNumbers = (...fields) => (row) =>
  fields.reduce((acc, f) => ({ ...acc, [f]: Number(row[f]) }), row);
