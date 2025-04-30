/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/service/mappers.ts
 * Common mapping functions for the generic service.
 * ---------------------------------------------------------------------*/
import { ObjectId } from "mongodb";
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
  // Create a shallow copy to avoid mutating the original document
  const temp = { ...doc } as Partial<TDoc & BaseDoc>;

  const _id = temp._id; // Capture original _id (ObjectId | undefined)
  delete temp._id; // Remove original _id property key from temp
  delete temp.modifiedAt; // Remove modifiedAt property key if it exists

  // 'temp' now holds the rest of the properties from the input doc (potentially partial)
  const rest = temp as Partial<Omit<TDoc, "_id" | "modifiedAt">>;

  // Construct the final API object
  const apiObject: PartialApiRepresentation<TDoc> = {
    // Add stringified _id first if the original _id existed
    ...(_id !== undefined && {
      _id: _id instanceof ObjectId ? _id.toHexString() : String(_id),
    }),
    // Spread the rest of the properties AFTER _id
    ...rest,
  };

  return apiObject;
};
