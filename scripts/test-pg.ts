import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const client = new Client({
  connectionString,
  connectionTimeoutMillis: 15000,
});

async function main() {
  try {
    console.log("Connecting directly with pg...");

    await client.connect();

    const result = await client.query(`
      SELECT
        current_database()::text AS database,
        NOW() AS "currentTime"
    `);

    console.log("Direct PostgreSQL connection successful.");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Direct PostgreSQL connection failed.");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

main();
