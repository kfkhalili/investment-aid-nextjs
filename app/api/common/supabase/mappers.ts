/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/supabase/mappers.ts
 * Common mapping & helper functions for the generic Supabase service.
 * ---------------------------------------------------------------------*/
import { BaseRow } from "./types"; // Import BaseRow from your common types

/**
 * Represents the structure of a partial API object derived from a BaseRow.
 * - Omits database-specific 'id' (original type) and 'modified_at'.
 * - Includes an optional string 'id'.
 * - Includes other fields from TRow as partial.
 * (Removed 'created_at' from Omit to match deleted fields)
 */
type PartialApiRepresentation<TRow extends BaseRow> = Partial<
  Omit<TRow, "id" | "modified_at"> // Only omit fields actually removed/replaced
> & {
  id?: string; // API ID is string and optional
};

/**
 * Generic function to map a Supabase/Postgres row object (full or partial) extending BaseRow
 * to a partial API representation suitable for API responses, respecting projections.
 * - Removes 'modified_at'.
 * - Converts the original 'id' to a string 'id' and places it first (if present).
 * - Returns a Partial object reflecting the input row's structure minus timestamps.
 */
export const mapRowToPartialApi = <TRow extends BaseRow>(
  row: TRow | Partial<TRow>
): PartialApiRepresentation<TRow> => {
  const temp = { ...row } as Partial<TRow & BaseRow>; // Copy input
  const id = temp.id; // Capture original id

  // Delete base fields that shouldn't be in the final API object in this form
  delete temp.id;
  delete temp.modified_at;
  // delete (temp as any).created_at; // Optional: Delete if created_at might exist on TRow but not BaseRow

  // 'temp' now holds the rest of the properties, matching the Omit in the corrected type def
  const rest = temp as Partial<Omit<TRow, "id" | "modified_at">>;

  // Construct the final API object structure
  // This structure now matches the corrected PartialApiRepresentation<TRow>
  const apiObject: PartialApiRepresentation<TRow> = {
    // Add stringified 'id' first if the original id existed
    ...(id !== undefined &&
      id !== null && {
        id: String(id), // Ensure API id is a string
      }),
    // Spread the rest of the properties after the 'id'
    ...rest,
  };

  return apiObject;
};

/**
 * Takes an object (potentially partial) and an array of ordered keys,
 * returning a new partial object containing ONLY the keys specified in
 * orderedKeys that also exist on the input object, in that specific order.
 */
export function reorderAndFilterObjectKeys<T>(
  obj: Partial<T>,
  orderedKeys: ReadonlyArray<keyof T>
): Partial<T> {
  const newObj: Partial<T> = {};
  for (const key of orderedKeys) {
    // Check property existence safely
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Direct assignment works fine without the Record constraint
      newObj[key] = obj[key];
    }
  }
  return newObj;
}
