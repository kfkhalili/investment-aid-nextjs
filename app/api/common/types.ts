/* ──────────────────────────────────────────────────────────────────────
 * src/api/common/service/types.ts
 * Common type definitions for the generic service.
 * ---------------------------------------------------------------------*/
import {
  ObjectId,
  IndexSpecification,
  Document as MongoDocument,
} from "mongodb";

/**
 * Base interface for documents stored in MongoDB by this service.
 * Requires fields essential for the service's operation.
 */
export interface BaseDoc {
  _id: ObjectId;
  /** The primary symbol identifier (e.g., stock ticker). */
  symbol: string;
  /** Timestamp indicating when this specific record was last fetched/updated. */
  modifiedAt: Date;
}

/**
 * Enum defining the strategy for fetching and caching data.
 */
export enum FetchMode {
  /** Fetch/cache individual symbols (e.g., Profile, IncomeStatement History). */
  BySymbol = "bySymbol",
  /** Fetch/cache the entire collection based on API criteria (e.g., Stock Screener). */
  FullCollection = "fullCollection",
}

/**
 * Configuration object for the generic caching service.
 *
 * @template RawType The raw data structure received from the FMP API for a single item.
 * @template DocType The data structure stored in MongoDB (must extend BaseDoc).
 * @template ApiType The data structure returned by the service's API methods to the client.
 */
export interface GenericServiceConfig<
  RawType,
  DocType extends BaseDoc & MongoDocument, // Ensure compatibility with MongoDB types
  ApiType
> {
  // --- Core Identification & Storage ---
  collectionName: string;
  collectionIndexes: IndexSpecification[];

  // --- FMP API Fetching ---
  fetchMode: FetchMode;
  fmpBasePath?: "v3" | "stable" | string; // Default: 'v3'
  fmpPath: string;
  fmpParams?: Record<string, string>;

  // --- Caching ---
  cacheTtlMs: number;

  // --- Data Structure, Uniqueness & Mapping ---
  uniqueKeyFields: ReadonlyArray<keyof DocType>;
  mapRawToDoc: (raw: RawType) => Omit<DocType, "_id" | "modifiedAt">;
  mapDocToApi: (doc: DocType | Partial<DocType>) => ApiType;
  listProjection?: { [K in keyof DocType]?: 1 };

  // --- Behavior Modifiers (Conditional based on fetchMode) ---
  isSingleRecordPerSymbol?: boolean; // Default: true if fetchMode='bySymbol'
  sortByFieldForLatest?: keyof DocType; // Required if fetchMode='bySymbol' && isSingleRecordPerSymbol=false

  // --- Optional Callbacks ---
  validateRawData?: (data: unknown) => data is RawType[] | RawType; // Type guard
  processRawDataArray?: (rawData: RawType[]) => RawType[];
}
