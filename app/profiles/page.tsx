// app/profiles/page.tsx  (SC)
import { Table } from "@/components/Table";
import { getProfiles, mapProfileDocToProfile } from "@/api/profiles/service";

export const revalidate = 60;

export default async function ProfilesPage() {
  const rows = await getProfiles();
  const data = rows.map(mapProfileDocToProfile);
  return <Table data={data} />;
}
