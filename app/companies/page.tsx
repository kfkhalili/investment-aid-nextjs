import { Table, Company } from "@/components/Table";

const Companies = async () => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL ?? ""}/api/company-profiles`,
    {
      next: { revalidate: 60 },
    }
  );

  if (!res.ok) {
    throw new Error("Could not load company profiles");
  }

  const data: Company[] = await res.json();

  return <Table data={data} />;
};

export default Companies;
