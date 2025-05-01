/* components/Table.tsx */
"use client";

import Image from "next/image";
import React from "react";

/* ──────── types ──────── */

export interface Company {
  _id: string;
  symbol: string;
  image: string;
  companyName: string;
  sector: string;
  industry: string;
  country: string;
  marketCap: number;
  price: number;
  change: number;
  volume: number;
}

interface TableProps {
  data: Company[];
}

/* ──────── helpers ──────── */

const tableHeaders: [string, string][] = [
  ["#", "text-right"],
  ["", "w-10"],
  ["Ticker", ""],
  ["Company", ""],
  ["Sector", ""],
  ["Industry", ""],
  ["Country", ""],
  ["Market Cap", "text-right"],
  ["P/E", "text-right"],
  ["Price", "text-right"],
  ["Change", "text-right"],
  ["Volume", "text-right"],
];

const CompanyLogo: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = React.useState(false);
  if (failed || !src) return null;
  return (
    <Image
      src={src}
      alt={alt}
      width={20}
      height={20}
      className="rounded-full"
      onError={() => setFailed(true)}
    />
  );
};

/* ──────── component ──────── */

export function Table({ data }: TableProps) {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-9xl">
        <div className="mt-6 overflow-x-auto rounded-md">
          <table className="min-w-full text-sm">
            <thead className="border-b border-gray-300 dark:border-gray-700 text-[color:var(--foreground)]">
              <tr className="select-none">
                {tableHeaders.map(([label, extra], i) => (
                  <th
                    key={i}
                    className={`px-2 py-2 font-semibold uppercase tracking-wide whitespace-nowrap ${extra}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>

            {/* body */}
            <tbody>
              {data.map((c, idx) => (
                <tr
                  key={c._id}
                  className="row-hover odd:bg-gray-50 dark:odd:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-600/60"
                >
                  <td className="px-2 py-2 text-right font-medium">
                    {idx + 1}
                  </td>
                  <td className="px-2 py-2">
                    <CompanyLogo src={c.image} alt={c.companyName} />
                  </td>
                  <td className="px-2 py-2">{c.symbol}</td>
                  <td className="px-2 py-2 font-medium">{c.companyName}</td>
                  <td className="px-2 py-2">{c.sector}</td>
                  <td className="px-2 py-2">{c.industry}</td>
                  <td className="px-2 py-2">{c.country}</td>
                  <td className="px-2 py-2 text-right">
                    {c.marketCap.toLocaleString("en-US")}
                  </td>
                  <td className="px-2 py-2 text-right">–</td>
                  <td className="px-2 py-2 text-right">{c.price}</td>
                  <td className="px-2 py-2 text-right">{c.change}</td>
                  <td className="px-2 py-2 text-right">
                    {c.volume.toLocaleString("en-US")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
