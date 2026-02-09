import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("❌ Please define MONGODB_URI in .env.local");
}

// After the guard above, TypeScript now knows `uri` is a string
const MONGODB_URI: string = uri;

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectMongo(): Promise<Db> {
  if (cachedDb) return cachedDb;

  const client =
    cachedClient ??
    new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
    });

  if (!cachedClient) {
    cachedClient = await client.connect();
  }

  cachedDb = cachedClient.db("fintech-auth");

  if (process.env.NODE_ENV === "development") {
    console.log("MongoDB connected");
  }

  return cachedDb;
}
