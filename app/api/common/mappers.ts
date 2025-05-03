/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/service/mappers.ts
 * Common mapping functions for the generic service.
 * ---------------------------------------------------------------------*/
import { BaseDoc } from "./types"; // Import BaseDoc from your common types

/**
 * Represents the structure of a partial API object derived from a BaseDoc.
 * - Omits MongoDB-specific _id (ObjectId) and modifiedAt.
 * - Includes an optional string _id.
 * - Includes other fields from TDoc as partial.
 */
type PartialApiRepresentation<TDoc extends BaseDoc> = Partial<
  Omit<TDoc, "_id" | "modifiedAt">
> & {
  _id?: string;
};

/**
 * Generic function to map a MongoDB document (full or partial) extending BaseDoc
 * to a partial API representation suitable for API responses, respecting projections.
 * - Removes 'modifiedAt'.
 * - Converts '_id' (ObjectId) to '_id' (string) and places it first (if present).
 * - Returns a Partial object containing only the fields present in the input `doc`
 * (plus the transformed _id), matching the structure PartialApiRepresentation<TDoc>.
 *
 * @template TDoc The MongoDB document type (must extend BaseDoc).
 * @param doc The input document (full TDoc or Partial<TDoc>).
 * @returns A partial API object corresponding to the input doc.
 */
export const mapDocToPartialApi = <TDoc extends BaseDoc>(
  doc: TDoc | Partial<TDoc>
): PartialApiRepresentation<TDoc> => {
  // Return type updated
  const temp = { ...doc } as Partial<TDoc & BaseDoc>;

  // Delete fields not needed in API response
  delete temp._id;
  delete temp.modifiedAt;

  // 'temp' now holds the rest, which matches the desired structure
  const apiObject = temp as PartialApiRepresentation<TDoc>;

  return apiObject;
};

/**
 * Takes an object (potentially partial) and an array of ordered keys,
 * returning a new partial object containing ONLY the keys specified in
 * orderedKeys that also exist on the input object, in that specific order.
 * This effectively filters and orders the object based on the provided keys.
 *
 * @template T The base type of the object (constrained to Record<string, unknown>).
 * @param {Partial<T>} obj The input partial object (e.g., Partial<Profile>).
 * @param {ReadonlyArray<keyof T>} orderedKeys An array of keys defining the desired output fields and their order.
 * @returns {Partial<T>} A new partial object with specified keys ordered and filtered.
 */
export function reorderAndFilterObjectKeys<T extends Record<string, unknown>>(
  obj: Partial<T>,
  orderedKeys: ReadonlyArray<keyof T> // Use ReadonlyArray for input safety
): Partial<T> {
  // Initialize an empty object that will conform to Partial<T>
  const newObj: Partial<T> = {};

  // Iterate through the desired keys IN ORDER
  for (const key of orderedKeys) {
    // Check if the input object actually has this property as its own
    // (Handles cases where obj is Partial<T> or key might not exist)
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // If the key exists on the input, copy its value to the new object.
      // Assigning 'unknown' (from obj[key]) to Partial<T>[key] is type-safe.
      newObj[key] = obj[key];
    }
    // If the key from orderedKeys doesn't exist in obj, it's simply skipped.
  }

  // The resulting object contains only the keys from orderedKeys that were
  // found in the original object, in the specified order.
  return newObj;
}
