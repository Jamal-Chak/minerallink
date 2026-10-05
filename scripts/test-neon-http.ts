import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(databaseUrl);

async function main() {
  console.log("Testing Neon HTTP connection...");

  const result = await sql`
    SELECT
      current_database()::text AS database,
      NOW() AS "currentTime"
  `;

  console.log("Neon HTTP connection successful.");
  console.log(result[0]);
}

main().catch((error) => {
  console.error("Neon HTTP connection failed.");
  console.error(error);
  process.exit(1);
});
