// app/balance-sheet-statements/page.tsx
import { getAllBalanceSheetStatements } from "@/lib/services/balance-sheet-statements";
import { SmartTable } from "@/components/SmartTable";

export const revalidate = 60;

export default async function BalanceSheetStatementsPage() {
  const data = await getAllBalanceSheetStatements();
  data.map((item) => {
    delete item.date;
    return item;
  });
  return <SmartTable data={data} />;
}
