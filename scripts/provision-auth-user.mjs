import { input, password, select } from "@inquirer/prompts";
import { getPool, closePool } from "../server/db/pool.js";
import { provisionAuthUser } from "../server/provisioning.js";

async function main() {
  if (process.env.NODE_ENV === "production")
    throw new Error("Provisioning is disabled in production.");
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) throw new Error("DATABASE_URL wajib tersedia.");
  let database;
  try {
    database = new URL(rawUrl).pathname.slice(1);
  } catch {
    throw new Error("DATABASE_URL tidak valid.");
  }
  if (!/^flexboard_(db|dev|development)$/.test(database))
    throw new Error(
      "Provisioning requires an approved local development database.",
    );

  let client;
  try {
    const name = (
      await input({
        message: "Nama tampilan:",
        validate: (value) =>
          value.trim() ? true : "Nama tampilan wajib diisi.",
      })
    ).trim();
    const email = (
      await input({
        message: "Email:",
        validate: (value) =>
          /^\S+@\S+\.\S+$/.test(value.trim().toLowerCase())
            ? true
            : "Email tidak valid.",
      })
    ).trim();
    const role = await select({
      message: "Role:",
      choices: [
        { name: "leader", value: "leader" },
        { name: "member", value: "member" },
      ],
    });
    const enteredPassword = await password({
      message: "Password:",
      mask: "*",
      toggleMask: false,
      validate: (value) =>
        value.length >= 8 ? true : "Password minimal 8 karakter.",
    });

    if (process.argv.includes("--dry-run")) {
      console.log("Input provisioning valid; tidak ada perubahan dibuat.");
      return;
    }
    client = await getPool().connect();
    const userId = await provisionAuthUser({
      client,
      email,
      name,
      role,
      password: enteredPassword,
    });
    console.log(`Auth user berhasil ditautkan: ${userId}`);
  } finally {
    client?.release();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
