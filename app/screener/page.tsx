// app/stock-screener/page.tsx
import { getStockScreenerResults } from "@/lib/services/stocker-screener";
import { SmartTable } from "@/components/SmartTable";

export const revalidate = 60;

export default async function ProfilesPage() {
  const data = await getStockScreenerResults();
  return <SmartTable data={data} />;
}
