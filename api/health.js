import { getPool } from "../server/db/pool.js";

export default async function handler(_request, response) {
  try {
    await getPool().query("SELECT 1");
    return response.status(200).json({ status: "ok", service: "flexboard-api", database: "ok" });
  } catch (error) {
    // Do not expose connection strings, SQL, or provider diagnostics publicly.
    console.error("[health] database readiness failed", error?.message || "unknown");
    return response.status(503).json({ status: "unavailable", service: "flexboard-api", database: "unavailable" });
  }
}
