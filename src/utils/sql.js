// ============================================================================
// utils/sql.js  -  helper to build UPDATE statements for PATCH requests.
//
// A PATCH request may send only SOME fields (e.g. just { price: 50 }). We must
// update only those columns and leave the others untouched.
//
//   const { setClause, params } = buildUpdate({ name: "Pasta", price: undefined, is_open: true });
//   setClause --> "name = $1, is_open = $2"
//   params    --> ["Pasta", true]
//
// Fields whose value is `undefined` are skipped.
//
// Safety: the COLUMN NAMES come from our own code (never from the client), and
// the VALUES go through $1, $2... placeholders, so this is safe from SQL injection.
// ============================================================================
export const buildUpdate = (fields) => {
  // [["name","Pasta"], ["is_open", true]]  (undefined ones removed)
  const entries = Object.entries(fields).filter(([, value]) => value !== undefined);

  return {
    // "name = $1, is_open = $2"  (placeholder numbers start at 1)
    setClause: entries.map(([column], index) => `${column} = $${index + 1}`).join(", "),
    // the matching values, in the same order
    params: entries.map(([, value]) => value),
  };
};
