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
