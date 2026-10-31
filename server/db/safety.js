const allowedDatabases = new Set([
  "flexboard_db",
  "flexboard_dev",
  "flexboard_development",
]);

export function assertSafeDevelopmentTarget(
  url,
  environment = process.env.NODE_ENV,
) {
  if (environment === "production")
    throw new Error("Database integration test is disabled in production.");
  if (!url)
    throw new Error("DATABASE_URL is required for database integration tests.");
  const parsed = new URL(url);
  if (!["localhost", "127.0.0.1", "::1"].includes(parsed.hostname))
    throw new Error(
      "Database integration test requires a loopback database host.",
    );
  if (!allowedDatabases.has(parsed.pathname.slice(1)))
    throw new Error(
      "Database integration test requires an approved development database.",
    );
  return parsed;
}
