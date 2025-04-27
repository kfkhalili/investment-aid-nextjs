import { Table, Company } from "@/components/Table";

const Companies = async () => {
  const res = await fetch("/api/company-profiles", { cache: "no-store" });

  if (!res.ok) {
    throw new Error("Could not load company profiles");
  }

  const data: Company[] = await res.json();

  return <Table data={data} />;
};

export default Companies;
