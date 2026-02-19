import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

const hash = bcrypt.hashSync("changeme123", 10);
console.log("[v0] Generated bcrypt hash:", hash);

const result = await sql`
  UPDATE admin_users SET password_hash = ${hash} WHERE username = 'admin'
`;
console.log("[v0] Update result:", result);

const check = await sql`SELECT id, username, password_hash FROM admin_users WHERE username = 'admin'`;
console.log("[v0] Admin user in DB:", check);

const verify = bcrypt.compareSync("changeme123", check[0].password_hash);
console.log("[v0] Password verification:", verify);
