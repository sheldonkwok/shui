import { drizzle } from "drizzle-orm/libsql";

const db = drizzle("file:sqlite.db");

export default db;
