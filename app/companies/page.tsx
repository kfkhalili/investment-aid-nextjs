// app/companies/page.tsx  (SC)
import { Table } from "@/components/Table";
import {
  getCompanyProfiles,
  mapCompanyProfileDocToCompanyProfile,
} from "@/api/company-profiles/service";

export const revalidate = 60;

export default async function CompaniesPage() {
  const rows = await getCompanyProfiles();
  const data = rows.map(mapCompanyProfileDocToCompanyProfile);
  return <Table data={data} />;
}
