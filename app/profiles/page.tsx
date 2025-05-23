// app/profiles/page.tsx
import { getAllProfiles } from "@/lib/services/profiles";
import { SmartTable } from "@/components/SmartTable";

export const revalidate = 60;

export default async function ProfilesPage() {
  const data = await getAllProfiles();
  return <SmartTable data={data} />;
}
