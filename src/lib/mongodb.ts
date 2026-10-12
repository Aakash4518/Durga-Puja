import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "laxman_chhapra_mela";
if (!uri) console.warn("MONGODB_URI is not configured; database-backed features are disabled.");
declare global { // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
let clientPromise: Promise<MongoClient> | undefined;
export async function getClient(): Promise<MongoClient> {
  if (!uri) throw new Error("Database is not configured. Set MONGODB_URI in .env.local.");
  if (process.env.NODE_ENV === "development") {
    global._mongoClientPromise ??= new MongoClient(uri).connect();
    clientPromise = global._mongoClientPromise;
  } else clientPromise ??= new MongoClient(uri).connect();
  return clientPromise;
}
export async function getDb(): Promise<Db> {
  const client = await getClient();
  return client.db(dbName);
}
