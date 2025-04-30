/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/service/genericService.ts
 * Implementation of the generic service creator function.
 * ---------------------------------------------------------------------*/
import {
  Collection,
  Filter,
  Sort,
  Document as MongoDocument,
  BulkWriteResult,
  FindOptions,
} from "mongodb";
import { ensureCollection } from "@/api/ensureCollection"; // Adjust path as needed
import { BaseDoc, GenericServiceConfig, FetchMode } from "./types";

// Helper function to safely get the API key from environment variables
function getFmpApiKey(): string {
  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    throw new Error("FMP_API_KEY environment variable is not set.");
  }
  return apiKey;
}

/**
 * Creates a generic service for fetching, caching (in MongoDB), and retrieving financial data from FMP.
 * Adapts behavior based on configuration (fetchMode, uniqueness, mapping, etc.).
 */
export function createGenericService<
  RawType,
  DocType extends BaseDoc & MongoDocument,
  ApiType
>(config: GenericServiceConfig<RawType, DocType, ApiType>) {
  // --- Config Destructuring & Defaults ---
  const {
    collectionName,
    collectionIndexes,
    fetchMode,
    fmpBasePath = "v3",
    fmpPath,
    fmpParams = {},
    cacheTtlMs,
    uniqueKeyFields,
    mapRawToDoc,
    mapDocToApi,
    listProjection,
    isSingleRecordPerSymbol = fetchMode === FetchMode.BySymbol,
    sortByFieldForLatest,
    validateRawData,
    processRawDataArray,
  } = config;

  // --- Configuration Validation ---
  if (
    fetchMode === FetchMode.BySymbol &&
    !isSingleRecordPerSymbol &&
    !sortByFieldForLatest
  ) {
    throw new Error(
      `Config Error (${collectionName}): sortByFieldForLatest must be provided when fetchMode='bySymbol' and isSingleRecordPerSymbol=false.`
    );
  }
  if (!uniqueKeyFields || uniqueKeyFields.length === 0) {
    throw new Error(
      `Config Error (${collectionName}): uniqueKeyFields array cannot be empty.`
    );
  }
  if (!uniqueKeyFields.includes("symbol")) {
    console.warn(
      `Config Warning (${collectionName}): uniqueKeyFields does not explicitly include 'symbol'. This might cause issues with 'getOne' or 'getAllForSymbol'.`
    );
  }

  // --- Collection Access (Memoized Promise) ---
  let _collectionPromise: Promise<Collection<DocType>> | null = null;
  function getCollection(): Promise<Collection<DocType>> {
    if (!_collectionPromise) {
      _collectionPromise = ensureCollection<DocType>(
        collectionName,
        ...collectionIndexes
      ).catch((err) => {
        _collectionPromise = null;
        console.error(`Failed to ensure collection ${collectionName}:`, err);
        throw err;
      });
    }
    return _collectionPromise;
  }

  // --- Helper: Build Unique Key Filter (Type-Safe) ---
  function buildKeyFilter(
    docData: Omit<DocType, "_id" | "modifiedAt"> | DocType
  ): Filter<DocType> {
    const filter: Filter<DocType> = {};
    for (const key of uniqueKeyFields) {
      const value = docData[key as keyof typeof docData];
      if (value === undefined) {
        throw new Error(
          `Config Error (${collectionName}): Value for unique key field '${String(
            key
          )}' is undefined in mapped document.`
        );
      }
      filter[key as keyof Filter<DocType>] = value;
    }
    if (Object.keys(filter).length !== uniqueKeyFields.length) {
      throw new Error(
        `Internal Error (${collectionName}): Failed to build a valid filter from uniqueKeyFields. Expected ${
          uniqueKeyFields.length
        } keys, got ${Object.keys(filter).length}.`
      );
    }
    return filter;
  }

  // --- Internal Fetch & Upsert Logic ---
  async function internalFetchAndUpsert(
    symbol?: string
  ): Promise<ApiType | ApiType[]> {
    const apiKey = getFmpApiKey();
    const baseQueryParams = { ...fmpParams, apikey: apiKey };
    let actualUrl: string;

    // Construct URL
    if (fetchMode === FetchMode.BySymbol) {
      if (!symbol)
        throw new Error(
          `Fetch Error (${collectionName}): Symbol required for fetchMode='bySymbol'.`
        );
      if (fmpPath === "profile" || fmpPath === "company/profile") {
        const queryParams = new URLSearchParams({
          ...baseQueryParams,
          symbol,
        }).toString();
        actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}?${queryParams}`;
      } else {
        const queryParams = new URLSearchParams(baseQueryParams).toString();
        actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}/${symbol}?${queryParams}`;
      }
    } else {
      // FetchMode.FullCollection
      const queryParams = new URLSearchParams(baseQueryParams).toString();
      actualUrl = `https://financialmodelingprep.com/api/${fmpBasePath}/${fmpPath}?${queryParams}`;
    }

    console.log(
      `Fetching from FMP [${fetchMode}]: ${actualUrl.replace(apiKey, "***")}`
    );
    const response = await fetch(actualUrl, { cache: "no-store" });

    // Process Fetch Response
    if (!response.ok) {
      let errorBody = `(Status ${response.status})`;
      try {
        errorBody = await response.text();
      } catch {
        /* Ignore */
      }
      console.error(
        `FMP Error Body (${response.status}) for ${actualUrl.replace(
          apiKey,
          "***"
        )}: ${errorBody}`
      );
      throw new Error(
        `FMP request failed (${response.status}) for ${fetchMode} fetch at ${fmpPath}. See console logs for details.`
      );
    }
    const rawJsonData: unknown = await response.json();

    // Validate Raw Data
    if (validateRawData && !validateRawData(rawJsonData)) {
      console.error("Raw data validation failed:", rawJsonData);
      throw new Error(
        `Invalid data structure received from FMP for ${fetchMode} fetch at ${fmpPath}.`
      );
    }

    // Standardize Raw Data to Array
    let rawArray: RawType[];
    if (Array.isArray(rawJsonData)) {
      rawArray = rawJsonData as RawType[];
    } else if (rawJsonData && typeof rawJsonData === "object") {
      rawArray = [rawJsonData as RawType];
    } else {
      throw new Error(
        `Unexpected raw data format received from FMP (expected object or array).`
      );
    }

    // Process Raw Data Array
    if (processRawDataArray) {
      try {
        rawArray = processRawDataArray(rawArray);
      } catch (processingError) {
        console.error(
          `Error during processRawDataArray for ${collectionName}: ${
            processingError instanceof Error
              ? processingError.message
              : String(processingError)
          }`
        );
        throw new Error(
          `Failed during raw data processing step for ${collectionName}.`
        );
      }
    }
    if (rawArray.length === 0) {
      const message =
        `No data available after processing from FMP for ${fetchMode} fetch at ${fmpPath}` +
        (symbol ? ` for symbol ${symbol}` : "");
      console.warn(message);
      if (fetchMode === FetchMode.BySymbol)
        throw new Error(`No data found for symbol ${symbol}.`);
      return [];
    }

    // Map Data and Prepare Bulk Write
    const col = await getCollection();
    const now = new Date();
    const bulk = col.initializeUnorderedBulkOp();
    const processedFilters: Array<Filter<DocType>> = [];

    for (const raw of rawArray) {
      try {
        let docData = mapRawToDoc(raw);
        if (
          fetchMode === FetchMode.BySymbol &&
          symbol &&
          docData.symbol !== symbol
        ) {
          console.warn(
            `Symbol mismatch for requested ${symbol}: FMP returned ${docData.symbol}. Overriding symbol.`
          );
          docData = { ...docData, symbol: symbol };
        }
        const replacement = { ...docData, modifiedAt: now };
        const filter = buildKeyFilter(replacement);
        bulk.find(filter).upsert().replaceOne(replacement);
        processedFilters.push(filter);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(
          `Error processing raw record in ${collectionName} (skipping): ${errorMessage}`,
          raw
        );
      }
    }

    // Execute Bulk Write Operation
    if (bulk.length === 0) {
      console.warn(
        `No valid bulk operations generated for ${collectionName} (${fetchMode})` +
          (symbol ? ` for symbol ${symbol}` : "")
      );
      if (fetchMode === FetchMode.BySymbol)
        throw new Error(
          `No processable data yielded any database operations for symbol ${symbol}.`
        );
      return [];
    }
    try {
      const bulkWriteResult: BulkWriteResult = await bulk.execute();
      console.log(
        `Bulk upsert (${collectionName}, ${fetchMode}): ${bulkWriteResult.upsertedCount} upserted, ${bulkWriteResult.matchedCount} matched, ${bulkWriteResult.modifiedCount} modified.`
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(
        `Bulk write error for ${collectionName} (${fetchMode}): ${errorMessage}`
      );
      throw new Error(
        `Failed to update database for ${collectionName}. ${errorMessage}`
      );
    }

    // Retrieve Final Results from DB and Return
    if (fetchMode === FetchMode.FullCollection) {
      if (processedFilters.length === 0) return [];
      const symbols = processedFilters.map((f) => f.symbol);
      const finalDocs = await col
        .find({ symbol: { $in: symbols } } as Filter<DocType>)
        .toArray();
      return finalDocs.map((doc) => mapDocToApi(doc as DocType)); // Cast needed: MongoDB driver returns WithId<T>
    } else {
      // FetchMode.BySymbol
      const filterForSymbol = { symbol } as Filter<DocType>; // Use type assertion
      if (isSingleRecordPerSymbol) {
        const finalDoc = await col.findOne(filterForSymbol);
        if (!finalDoc)
          throw new Error(
            `Consistency error: Could not retrieve upserted doc for ${symbol}. Filter: ${JSON.stringify(
              filterForSymbol
            )}`
          );
        return mapDocToApi(finalDoc as DocType); // Cast needed
      } else {
        if (!sortByFieldForLatest)
          throw new Error(
            "Assertion Failed: sortByFieldForLatest is undefined for multi-record BySymbol mode."
          );
        const sortCriteria: Sort = {};
        sortCriteria[sortByFieldForLatest as string] = -1;
        const finalLatestDoc = await col
          .find(filterForSymbol)
          .sort(sortCriteria)
          .limit(1)
          .next();
        if (!finalLatestDoc)
          throw new Error(
            `Consistency error: Could not retrieve latest upserted doc for ${symbol}. Filter: ${JSON.stringify(
              filterForSymbol
            )}`
          );
        return mapDocToApi(finalLatestDoc as DocType); // Cast needed
      }
    }
  } // End of internalFetchAndUpsert

  // --- Service Method: Get Single/Latest Record by Symbol ---
  async function getOne(symbol: string): Promise<ApiType | null> {
    const col = await getCollection();
    const filter = { symbol: symbol } as Filter<DocType>; // Use type assertion

    if (fetchMode === FetchMode.FullCollection) {
      console.log(
        `getOne(${symbol}) reading from potentially stale collection (${collectionName}, fullCollection mode).`
      );
      const doc = await col.findOne(filter);
      return doc ? mapDocToApi(doc as DocType) : null; // Cast needed
    } else {
      // FetchMode.BySymbol
      const sortOptions: Sort = {};
      if (!isSingleRecordPerSymbol && sortByFieldForLatest) {
        sortOptions[sortByFieldForLatest as string] = -1; // Cast needed
      }
      const latestDocInDb = await col
        .find(filter)
        .sort(sortOptions)
        .limit(1)
        .next();
      const isFresh =
        latestDocInDb &&
        Date.now() - latestDocInDb.modifiedAt.getTime() < cacheTtlMs;

      if (isFresh) {
        console.log(`Cache hit for ${symbol} (${collectionName})`);
        return mapDocToApi(latestDocInDb as DocType); // Cast needed (isFresh confirms not null)
      } else {
        console.log(
          `Cache ${
            latestDocInDb ? "stale" : "miss"
          } for ${symbol} (${collectionName}). Fetching...`
        );
        try {
          const result = await internalFetchAndUpsert(symbol);
          if (Array.isArray(result))
            throw new Error(
              "Internal Error: Expected single result for BySymbol fetch."
            );
          return result as ApiType; // Cast justified
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError);
          console.error(
            `Error fetching ${symbol} for ${collectionName}: ${errorMessage}`
          );
          if (latestDocInDb) {
            console.warn(
              `Returning stale data for ${symbol} due to fetch error.`
            );
            return mapDocToApi(latestDocInDb as DocType); // Cast needed
          }
          return null;
        }
      }
    }
  } // End of getOne

  // --- Service Method: Get All Records for a Specific Symbol (History) ---
  async function getAllForSymbol(symbol: string): Promise<ApiType[]> {
    const col = await getCollection();
    const filter = { symbol: symbol } as Filter<DocType>; // Use type assertion

    if (fetchMode === FetchMode.FullCollection) {
      console.warn(
        `getAllForSymbol called in fullCollection mode (${collectionName}). Reading current data for ${symbol}. Consider using getOne.`
      );
      const doc = await col.findOne(filter);
      return doc ? [mapDocToApi(doc as DocType)] : []; // Cast needed
    } else {
      // FetchMode.BySymbol
      if (isSingleRecordPerSymbol) {
        const singleApiRecord = await getOne(symbol);
        return singleApiRecord ? [singleApiRecord] : [];
      } else {
        await getOne(symbol); // Ensure freshness of latest
        const sortOptions: Sort = {};
        if (sortByFieldForLatest) {
          sortOptions[sortByFieldForLatest as string] = -1; // Cast needed
        }
        const docs = await col.find(filter).sort(sortOptions).toArray();
        return docs.map((doc) => mapDocToApi(doc as DocType)); // Cast needed
      }
    }
  } // End of getAllForSymbol

  // --- Service Method: Get All Records (List View / Full Collection Refresh Trigger) ---
  async function getAll(): Promise<ApiType[]> {
    const col = await getCollection();

    if (fetchMode === FetchMode.FullCollection) {
      const latestDocInCollection = await col.findOne(
        {},
        { sort: { modifiedAt: -1 } }
      );
      const isFresh =
        latestDocInCollection &&
        Date.now() - latestDocInCollection.modifiedAt.getTime() < cacheTtlMs;

      if (!isFresh) {
        console.log(
          `Collection cache ${
            latestDocInCollection ? "stale" : "miss"
          } for ${collectionName}. Fetching full collection...`
        );
        try {
          const freshData = await internalFetchAndUpsert();
          if (!Array.isArray(freshData))
            throw new Error(
              "Internal Error: Expected array result for FullCollection fetch."
            );
          return freshData as ApiType[]; // Cast justified
        } catch (fetchError) {
          const errorMessage =
            fetchError instanceof Error
              ? fetchError.message
              : String(fetchError);
          console.error(
            `Error fetching full collection ${collectionName}: ${errorMessage}`
          );
          console.warn(
            `Returning empty array for ${collectionName} due to fetch error.`
          );
          return [];
        }
      } else {
        console.log(`Collection cache hit for ${collectionName}.`);
        const docs = await col.find({} as Filter<DocType>).toArray();
        return docs.map((doc) => mapDocToApi(doc as DocType)); // Cast needed
      }
    } else {
      // FetchMode.BySymbol
      console.log(
        `getAll reading list for ${collectionName} (bySymbol mode). Applying projection if configured.`
      );
      const findOptions: FindOptions<DocType> = listProjection
        ? { projection: listProjection }
        : {};
      const docs = await col
        .find({} as Filter<DocType>, findOptions)
        .limit(1000)
        .sort({ symbol: 1 })
        .toArray();
      // Cast needed when projecting or passing to mapDocToApi which accepts Partial
      return docs.map((doc) => mapDocToApi(doc as DocType | Partial<DocType>));
    }
  } // End of getAll

  // --- Return Public Service API ---
  return { getCollection, getAll, getOne, getAllForSymbol };
} // End of createGenericService
