import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

console.log("Creating isolated PrismaPg adapter...");

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  console.log("Connecting through isolated PrismaPg...");

  const result = await prisma.$queryRaw<
    { database: string; currentTime: Date }[]
  >`
    SELECT
      current_database()::text AS database,
      NOW() AS "currentTime"
  `;

  console.log("Isolated PrismaPg connection successful.");
  console.log(result[0]);
}

main()
  .catch((error) => {
    console.error("Isolated PrismaPg connection failed.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
