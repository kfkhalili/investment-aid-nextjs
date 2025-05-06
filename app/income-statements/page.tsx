// app/income-statements/page.tsx
import { getAllIncomeStatements } from "@/lib/services/income-statements";
import { SmartTable } from "@/components/SmartTable";

export const revalidate = 60;

export default async function IncomeStatementsPage() {
  const data = await getAllIncomeStatements();
  data.map((item) => {
    delete item.date;
    return item;
  });
  return <SmartTable data={data} />;
}
