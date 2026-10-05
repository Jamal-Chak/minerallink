import { prisma } from "../lib/db";

async function main() {
  const result = await prisma.$queryRaw<
    { database: string; currentTime: Date }[]
  >`
    SELECT
      current_database()::text AS database,
      NOW() AS "currentTime"
  `;

  console.log("MineralLink database connection successful.");
  console.log(result[0]);
}

main()
  .catch((error) => {
    console.error("Database connection failed.");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
