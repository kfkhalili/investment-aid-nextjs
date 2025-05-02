/* app/components/SmartTable.tsx */
"use client";

import React from "react";
import Image from "next/image";
import clsx from "clsx";

/* ───────────────────────── Consolidated Types ─────────────────────────── */

/** Defines possible text alignment options for cells */
export type Alignment = "text-left" | "text-center" | "text-right";

/** Generic type for the data items. Assumes each item has an 'id' or '_id'. */
type DataItem = {
  id?: string | number;
  _id?: string | number;
  [key: string]: unknown;
};

/** Configuration for individual columns */
type ColumnConfig<T extends DataItem> = {
  [K in keyof T]?: {
    header?: string;
    render?: (value: T[K], item: T) => React.ReactNode;
    align?: Alignment;
    hidden?: boolean;
  };
};

/** Props for the SmartTable component */
interface SmartTableProps<T extends DataItem> {
  data: T[];
  columnConfig?: ColumnConfig<T>;
  showRowNumber?: boolean;
}

/** Base interface containing common cell properties (simplified) */
interface BaseCellProps {
  alignment: Alignment;
  widthClass?: string;
  baseClassName?: string; // Optional override for base styles
}

/** Props specific to TableHeaderCell */
interface TableHeaderCellProps extends BaseCellProps {
  label: React.ReactNode;
}

/** Props specific to TableDataCell */
interface TableDataCellProps extends BaseCellProps {
  content: React.ReactNode;
  isRowNumber?: boolean;
  rowNumberClassName?: string; // Optional override for row number text style
}

/* ──────────────── H E L P E R S / Sub-Components ──────────────── */

/**
 * Formats a key string (object property name) into a more readable header label.
 */
const formatHeaderLabel = (key: string): string => {
  if (!key) return "";
  if (key === "_id" || key === "id") return "ID";
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
  // Simple placeholder, consider a more robust solution if needed
  const placeholderSrc = `https://placehold.co/20x20/eee/ccc?text=?`;

  if (failed || !src || typeof src !== "string") {
    return (
      <Image
        src={placeholderSrc}
        alt={alt}
        width={20}
        height={20}
        className={clsx("rounded-full object-cover", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className={clsx("rounded-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
};

/**
 * Renders a single table header cell (<th>).
 */
const TableHeaderCell: React.FC<TableHeaderCellProps> = ({
  label,
  alignment,
  widthClass,
  // Base styles for header cells
  baseClassName = "px-3 py-3 text-xs font-semibold uppercase tracking-wider whitespace-nowrap",
}) => {
  // Combine classes using clsx - simplified as sticky/border are removed
  const finalClassName = clsx(baseClassName, alignment, widthClass);

  return (
    <th scope="col" className={finalClassName}>
      {label}
    </th>
  );
};

/**
 * Renders a single table data cell (<td>).
 */
const TableDataCell: React.FC<TableDataCellProps> = ({
  content,
  isRowNumber = false,
  alignment,
  widthClass,
  // Base styles for data cells
  baseClassName = "px-3 py-3 whitespace-nowrap",
  // Default specific styling for row number text (can be overridden)
  rowNumberClassName = "font-medium", // Removed color here, apply via theme/global css if needed
}) => {
  // Combine all classes using clsx - simplified as sticky/border are removed
  const finalClassName = clsx(baseClassName, alignment, widthClass, {
    // Apply specific row number styling additively if it's a row number cell
    [rowNumberClassName]: isRowNumber,
  });

  return <td className={finalClassName}>{content}</td>;
};

/**
 * Default cell renderer logic. Determines content and alignment based on key/type.
 * (Content mostly unchanged, retained for data formatting)
 */
const defaultRenderCellContent = <T extends DataItem>(
  value: unknown,
  key: keyof T,
  item: T,
  config?: ColumnConfig<T>[keyof T]
): { content: React.ReactNode; alignment: Alignment } => {
  // --- 1. Handle Custom Render Function FIRST ---
  if (config?.render) {
    const customContent = config.render(value as T[typeof key], item);
    const alignment = config?.align || "text-left";
    return {
      content: customContent === undefined ? null : customContent,
      alignment,
    };
  }

  let content: React.ReactNode = null;
  let defaultAlignment: Alignment = "text-left";

  // --- 2. Handle Specific Key Names (Images) ---
  const stringKey = String(key);
  const lowerKey = stringKey.toLowerCase();
  if (
    lowerKey.includes("image") ||
    lowerKey.includes("logo") ||
    lowerKey.includes("avatar")
  ) {
    const altText = String(item?.name || item?.companyName || key);
    content = (
      <GenericImage
        src={typeof value === "string" ? value : ""}
        alt={altText}
      />
    );
    defaultAlignment = "text-center";
    const finalAlignment = config?.align || defaultAlignment;
    return { content, alignment: finalAlignment };
  }

  // --- 3. Handle Data Types ---
  switch (typeof value) {
    case "number":
      content = value.toLocaleString("en-US");
      defaultAlignment = "text-right";
      break;
    case "boolean":
      content = value ? "Yes" : "No";
      defaultAlignment = "text-center";
      break;
    case "string":
      if (!value) {
        content = "–";
        defaultAlignment = "text-left";
      } else if (value.startsWith("http://") || value.startsWith("https://")) {
        try {
          new URL(value);
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
          defaultAlignment = "text-center";
        } catch {
          content = value;
          defaultAlignment = "text-left";
        }
      } else {
        content = value;
        defaultAlignment = "text-left";
      }
      break;
    case "object":
      if (value === null) {
        content = "–";
        defaultAlignment = "text-center";
      } else if (value instanceof Date) {
        content = value.toLocaleDateString();
        defaultAlignment = "text-left";
      } else {
        content = "[Object]";
        defaultAlignment = "text-left";
      }
      break;
    case "undefined":
      content = "–";
      defaultAlignment = "text-center";
      break;
    default:
      try {
        content = String(value);
      } catch {
        content = "–";
      }
      defaultAlignment = "text-left";
      break;
  }

  // --- 4. Final Alignment Determination ---
  const finalAlignment = config?.align || defaultAlignment;
  return { content, alignment: finalAlignment };
};

/* ─────────── M A I N   S M A R T   T A B L E   C O M P O N E N T ─────────── */

/**
 * Renders a flexible, type-safe table. Sticky columns functionality removed.
 */
export function SmartTable<T extends DataItem>({
  data,
  columnConfig = {},
  showRowNumber = true,
}: SmartTableProps<T>): React.ReactElement | null {
  const columnKeys = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const firstItemKeys = Object.keys(data[0]);
    return firstItemKeys.filter(
      (key) => !columnConfig[key as keyof T]?.hidden
    ) as Array<keyof T>;
  }, [data, columnConfig]);

  // --- Render Loading/Empty State ---
  if (!data) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        Loading...
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
        No data available.
      </div>
    );
  }

  // --- Constants ---
  const ROW_NUMBER_WIDTH_CLASS = "w-10"; // Adjusted width as per your last version

  // --- Render Table ---
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-9xl">
        <div
          className="mt-6 overflow-x-auto rounded-md stable-scrollbar"
          tabIndex={0}
        >
          {/* Kept stable-scrollbar class in case it's useful */}
          <table className="min-w-full text-sm table-fixed">
            {/* Added table-fixed for potentially more stable layout */}
            <thead className="border-b border-gray-300 dark:border-gray-700 text-[color:var(--foreground)]">
              <tr className="select-none">
                {/* Row Number Header (No longer sticky) */}
                {showRowNumber && (
                  <TableHeaderCell
                    label="#"
                    alignment="text-right"
                    widthClass={ROW_NUMBER_WIDTH_CLASS}
                  />
                )}
                {/* Data Column Headers (No longer sticky) */}
                {columnKeys.map((key) => {
                  const config = columnConfig[key];
                  const headerLabel =
                    config?.header || formatHeaderLabel(String(key));
                  const firstValue = data[0]?.[key];
                  const typeBasedDefaultAlignment: Alignment =
                    typeof firstValue === "number" ? "text-right" : "text-left";
                  const alignment = config?.align || typeBasedDefaultAlignment;

                  return (
                    <TableHeaderCell
                      key={String(key)}
                      label={headerLabel}
                      alignment={alignment}
                      // No widthClass passed unless configured - relies on table-fixed
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-[color:var(--foreground)]">
              {data.map((item, idx) => (
                <tr
                  key={item._id ?? item.id ?? idx}
                  className="row-hover odd:bg-gray-50 dark:odd:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-600/60 transition-colors duration-150"
                >
                  {/* Row Number Cell (No longer sticky) */}
                  {showRowNumber && (
                    <TableDataCell
                      content={idx + 1}
                      alignment="text-right"
                      widthClass={ROW_NUMBER_WIDTH_CLASS}
                      isRowNumber={true}
                    />
                  )}
                  {/* Data Cells (No longer sticky) */}
                  {columnKeys.map((key) => {
                    const value = item[key];
                    const config = columnConfig[key];
                    const { content, alignment } = defaultRenderCellContent(
                      value,
                      key,
                      item,
                      config
                    );

                    return (
                      <TableDataCell
                        key={`${String(item._id ?? item.id ?? idx)}-${String(
                          key
                        )}`}
                        content={content}
                        alignment={alignment}
                        isRowNumber={false}
                        // No widthClass passed unless configured - relies on table-fixed
                      />
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
