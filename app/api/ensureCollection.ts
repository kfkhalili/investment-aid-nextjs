import type { Collection, Document, IndexSpecification } from "mongodb";
import { getDb } from "@/api/mongodb";

export async function ensureCollection<T extends Document>(
  name: string,
  index?: IndexSpecification
): Promise<Collection<T>> {
  const db = await getDb();

  // create on first run
  if (!(await db.listCollections({ name }).hasNext())) {
    await db.createCollection(name);
  }

  const col = db.collection<T>(name);

  if (index) {
    // no-op when the index already exists
    await col.createIndex(index);
  }

  return col;
}
