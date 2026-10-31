import { input, password } from "@inquirer/prompts";
import { verifyPassword } from "better-auth/crypto";
import { getPool, closePool } from "../server/db/pool.js";

const email = (await input({ message: "Email akun:" })).trim().toLowerCase();
const candidate = await password({
  message: "Password kandidat (opsional):",
  mask: "*",
  default: "",
});
const pool = getPool();
try {
  const user = await pool.query(
    'SELECT id FROM "user" WHERE lower(email)=lower($1)',
    [email],
  );
  if (!user.rowCount) {
    console.log("user: tidak cocok");
    process.exitCode = 1;
  } else {
    const account = await pool.query(
      'SELECT "accountId", "providerId", password, "userId" FROM account WHERE "userId"=$1 AND "providerId"=$2',
      [user.rows[0].id, "credential"],
    );
    const profile = await pool.query(
      "SELECT auth_subject, role, is_active FROM profiles WHERE auth_subject=$1",
      [user.rows[0].id],
    );
    const passwordMatch =
      account.rowCount && candidate
        ? await verifyPassword({
            hash: account.rows[0].password,
            password: candidate,
          })
        : null;
    console.log(
      `user: cocok\ncredential: ${account.rowCount ? "cocok" : "tidak cocok"}\nprofile mapping: ${profile.rowCount && profile.rows[0].auth_subject === user.rows[0].id ? "cocok" : "tidak cocok"}\nrole: ${profile.rowCount && ["leader", "member"].includes(profile.rows[0].role) ? "cocok" : "tidak cocok"}\nprofil aktif: ${profile.rowCount && profile.rows[0].is_active ? "cocok" : "tidak cocok"}\npassword: ${passwordMatch === true ? "cocok" : "tidak cocok"}`,
    );
    process.exitCode = [
      account.rowCount,
      profile.rowCount && profile.rows[0].auth_subject === user.rows[0].id,
      profile.rowCount && ["leader", "member"].includes(profile.rows[0].role),
      profile.rowCount && profile.rows[0].is_active,
      passwordMatch === true,
    ].every(Boolean)
      ? 0
      : 1;
  }
} finally {
  await closePool();
}
