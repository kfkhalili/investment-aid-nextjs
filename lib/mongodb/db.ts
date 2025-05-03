import { MongoClient, Db } from "mongodb";

let cachedDb: Db | null = null;

export async function getDb(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const uri = process.env.MONGODB_URI!;
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5_000,
  });
  await client.connect();
  cachedDb = client.db(process.env.MONGODB_DB!);
  return cachedDb;
}
