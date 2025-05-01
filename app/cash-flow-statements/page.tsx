// app/balance-sheet-statements/page.tsx
import { getAllCashFlowStatements } from "@/api/cash-flow-statement/service";
import { SmartTable } from "@/components/SmartTable";

export const revalidate = 60;

export default async function CashFlowStatementsPage() {
  const data = await getAllCashFlowStatements();
  data.map((item) => {
    delete item.date;
    return item;
  });
  return <SmartTable data={data} />;
}
