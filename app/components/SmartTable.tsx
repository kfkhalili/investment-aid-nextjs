/* components/SmartTable.tsx */
"use client"; // Assuming Next.js environment based on original code

import React from "react";
import Image from "next/image";

/* ─────────── Types ─────────── */

// Generic type for the data items. Assumes each item has an 'id' or '_id'.
// Replaced `[key: string]: any` with `[key: string]: unknown` for better type safety.
type DataItem = {
  id?: string | number;
  _id?: string | number;
  [key: string]: unknown; // Use unknown instead of any
};

// Props for the SmartTable component, using generics for the data type.
interface SmartTableProps<T extends DataItem> {
  /** The array of data objects to display */
  data: T[];
  /** Optional configuration for specific columns */
  columnConfig?: ColumnConfig<T>;
  /** Optional flag to display row numbers */
  showRowNumber?: boolean;
}

// Configuration for individual columns, typed based on the data item type T.
type ColumnConfig<T extends DataItem> = {
  // Use Partial to make all properties optional
  // Use K in keyof T to iterate over the keys of the data item type
  [K in keyof T]?: {
    /** Custom header label (defaults to formatted key) */
    header?: string;
    /** Custom render function for the cell content. Must return a valid ReactNode. */
    // The value passed to render is correctly typed as T[K] (the type of the specific key K in T)
    render?: (value: T[K], item: T) => React.ReactNode;
    /** CSS class for text alignment */
    align?: "text-left" | "text-center" | "text-right";
    /** Hide the column */
    hidden?: boolean;
  };
};

/* ─────────── Helper Components & Functions ─────────── */

/**
 * Formats a key string (object property name) into a more readable header label.
 * Example: "companyName" -> "Company Name", "_id" -> "ID"
 */
const formatHeaderLabel = (key: string): string => {
  if (!key) return "";
  if (key === "_id" || key === "id") return "ID";
  // Add spaces before uppercase letters (camelCase) and capitalize first letter
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

/**
 * Generic Image Component with Error Handling and Placeholder.
 */
const GenericImage: React.FC<{
  src: string;
  alt?: string;
  className?: string;
}> = ({ src, alt = "image", className = "" }) => {
  const [failed, setFailed] = React.useState(false);
  // Placeholder image URL
  const placeholderSrc = `https://placehold.co/20x20/eee/ccc?text=?`;

  // Render placeholder if image failed to load or src is invalid/missing
  if (failed || !src || typeof src !== "string") {
    // Added type check for src
    return (
      <Image
        src={placeholderSrc}
        alt={alt}
        width={20}
        height={20}
        className={`rounded-full object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  // Render the actual image
  return (
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className={`rounded-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * Default cell renderer logic. Determines content and alignment based on key/type.
 * Uses `unknown` for the value and performs type checks.
 */
const defaultRenderCellContent = <T extends DataItem>(
  value: unknown, // Use unknown for the value, requiring type checks
  key: keyof T,
  item: T,
  config?: ColumnConfig<T>[keyof T] // Type config based on the specific key
): { content: React.ReactNode; alignment: string } => {
  let content: React.ReactNode = null;
  // Determine alignment: use config first, then default based on type checks
  let alignment = config?.align || "text-left"; // Default alignment

  // --- 1. Handle Custom Rendering via Config ---
  if (config?.render) {
    // We need to cast `value` here because the config.render function expects T[K],
    // but defaultRenderCellContent receives `unknown`. This cast assumes the caller
    // passes the correct value type matching the key.
    const customContent = config.render(value as T[typeof key], item);
    // Ensure custom render function doesn't return undefined
    return {
      content: customContent === undefined ? null : customContent,
      alignment,
    };
  }

  // --- 2. Handle Specific Key Names (Case-Insensitive) ---
  // Check if key is a string before doing string operations
  if (typeof key === "string") {
    const lowerKey = key.toLowerCase();
    // Render images for keys containing 'image', 'logo', or 'avatar'
    if (
      lowerKey.includes("image") ||
      lowerKey.includes("logo") ||
      lowerKey.includes("avatar")
    ) {
      // Check if the value is a non-empty string before rendering GenericImage
      if (typeof value === "string" && value) {
        content = (
          <GenericImage
            src={value}
            alt={String(item?.name || item?.companyName || key)}
          />
        );
        alignment = config?.align || "text-center"; // Center images by default
      } else {
        // Render placeholder or null if value is not a valid image source string
        content = (
          <GenericImage
            src=""
            alt={String(item?.name || item?.companyName || key)}
          />
        ); // Show placeholder
        alignment = config?.align || "text-center";
      }
      // Return early for image handling
      return { content, alignment };
    }
    // Add more specific key handling here if needed (e.g., status badges)
  }

  // --- 3. Handle Data Types using typeof and instanceof ---
  switch (typeof value) {
    case "number":
      content = value.toLocaleString("en-US"); // Format numbers
      alignment = config?.align || "text-right"; // Right-align numbers
      break;
    case "boolean":
      content = value ? "Yes" : "No"; // Display 'Yes'/'No'
      alignment = config?.align || "text-center"; // Center booleans
      break;
    case "string":
      // Handle empty strings and potential URLs
      if (!value) {
        content = "–"; // Use en-dash for empty strings
        alignment = config?.align || "text-left";
      } else if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          new URL(value); // Validate URL
          content = (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline dark:text-blue-400"
            >
              Link
            </a>
          );
          alignment = config?.align || "text-center"; // Center links
        } catch {
          // Not a valid URL, treat as regular string
          content = value;
          alignment = config?.align || "text-left";
        }
      } else {
        // Render non-empty, non-URL strings
        content = value;
        alignment = config?.align || "text-left";
      }
      break;
    case "object":
      // Handle null, Date objects, or provide placeholder for others
      if (value === null) {
        content = "–"; // Use en-dash for null
        alignment = config?.align || "text-center";
      } else if (value instanceof Date) {
        content = value.toLocaleDateString(); // Format dates
        alignment = config?.align || "text-left";
      } else {
        // Placeholder for generic objects - avoid rendering directly
        content = "[Object]";
        alignment = config?.align || "text-left";
      }
      break;
    case "undefined":
      content = "–"; // Use en-dash for undefined
      alignment = config?.align || "text-center";
      break;
    case "symbol":
    case "bigint":
      // Convert symbols and bigints to string for display
      content = String(value);
      alignment = config?.align || "text-left";
      break;
    case "function":
      // Avoid rendering functions directly
      content = "[Function]";
      alignment = config?.align || "text-left";
      break;
    default:
      // Fallback for any unexpected types (should be rare with `unknown`)
      try {
        content = String(value);
      } catch {
        content = "–"; // Handle potential errors during string conversion
      }
      alignment = config?.align || "text-left";
  }

  // Return the determined content and alignment
  return { content, alignment };
};

/* ─────────── Main Component ─────────── */

/**
 * Renders a flexible, type-safe table based on the provided data array and optional configuration.
 * Assumes data is an array of objects with consistent keys.
 * Uses `unknown` for stricter typing, requiring runtime checks for cell rendering.
 *
 * @template T The type of the data items in the array, extending DataItem.
 * @param {SmartTableProps<T>} props The component props.
 * @param {T[]} props.data Array of data objects.
 * @param {ColumnConfig<T>} [props.columnConfig={}] Optional configuration for columns.
 * @param {boolean} [props.showRowNumber=true] Optional flag to display row numbers.
 * @returns {React.ReactElement | null} The rendered table component or null/message.
 */
export function SmartTable<T extends DataItem>({
  data,
  columnConfig = {},
  showRowNumber = true,
}: SmartTableProps<T>): React.ReactElement | null {
  // Explicit return type

  // --- Memoize Column Keys ---
  // Derive column keys from the first data item. Filter out hidden columns.
  // Assumes all data items share the same structure for columns.
  const columnKeys = React.useMemo(() => {
    if (!data || data.length === 0) {
      return []; // Return empty array if no data
    }
    const firstItemKeys = Object.keys(data[0]);
    // Filter keys based on the hidden property in columnConfig
    // Ensure the key exists in the config type before checking 'hidden'
    return firstItemKeys.filter((key) => {
      const config = columnConfig[key as keyof T];
      return !config?.hidden;
    }) as Array<keyof T>; // Assert the final type after filtering
  }, [data, columnConfig]); // Recalculate only if data or config changes

  // --- Render Loading/Empty State ---
  if (!data) {
    // Can return null or a loading indicator
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }
  if (data.length === 0) {
    // Render message when data array is empty
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No data available.
      </div>
    );
  }

  // --- Render Table ---
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-9xl">
        <div className="mt-6 overflow-x-auto rounded-md">
          <table className="min-w-full text-sm">
            {/* Table Header */}
            <thead className="border-b border-gray-300 dark:border-gray-700 text-[color:var(--foreground)]">
              <tr className="select-none">
                {/* Row Number Header (Optional & Sticky) */}
                {showRowNumber && (
                  <th
                    scope="col"
                    className="sticky left-0 z-10 px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider w-12 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700" // Added background and border for sticky header
                  >
                    #
                  </th>
                )}
                {/* Dynamic Data Headers */}
                {columnKeys.map((key, index) => {
                  const config = columnConfig[key];
                  const headerLabel =
                    config?.header || formatHeaderLabel(String(key));
                  // Determine header alignment based on config or inferred type
                  const firstValue = data[0]?.[key];
                  const defaultAlignment =
                    typeof firstValue === "number" ? "text-right" : "text-left";
                  const alignment = config?.align || defaultAlignment;
                  // Make first data column sticky if row numbers are shown
                  const isFirstDataColumn = index === 0 && showRowNumber;
                  return (
                    <th
                      key={String(key)}
                      scope="col"
                      // Apply sticky positioning and background to the first data column header if row numbers are visible
                      className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap ${alignment} ${
                        isFirstDataColumn
                          ? "sticky left-12 z-10 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
                          : ""
                      }`}
                    >
                      {headerLabel}
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              {data.map((item, idx) => (
                <tr
                  key={item._id ?? item.id ?? idx} // Use unique ID or index
                  className="row-hover hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors duration-150"
                >
                  {/* Row Number Cell (Optional & Sticky) */}
                  {showRowNumber && (
                    <td
                      // Apply sticky positioning and background to row number cell
                      className="sticky left-0 z-10 px-3 py-3 whitespace-nowrap text-right font-medium text-gray-500 dark:text-gray-400 w-12 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                    >
                      {idx + 1}
                    </td>
                  )}
                  {/* Dynamic Data Cells */}
                  {columnKeys.map((key, index) => {
                    const value = item[key]; // value is initially 'unknown'
                    const config = columnConfig[key];
                    // Get rendered content and alignment using the helper
                    // defaultRenderCellContent handles the 'unknown' type internally
                    const { content, alignment } = defaultRenderCellContent(
                      value,
                      key,
                      item,
                      config
                    );
                    // Make first data column sticky if row numbers are shown
                    const isFirstDataColumn = index === 0 && showRowNumber;
                    return (
                      <td
                        key={String(key)}
                        // Apply alignment, sticky positioning, and background if needed
                        className={`px-3 py-3 whitespace-nowrap ${alignment} ${
                          isFirstDataColumn
                            ? "sticky left-12 z-10 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700"
                            : ""
                        }`}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Note: Example usage section is removed from the component file itself.
// Remember to import and use this component appropriately in your application.
