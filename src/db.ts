import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

import { dbCredentials } from './utils.ts';

const client = createClient(dbCredentials);

const db = drizzle(client);

export default db;
