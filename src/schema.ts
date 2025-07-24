import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

import { createInsertSchema } from "drizzle-arktype";

export const plants = sqliteTable("plants", {
  id: integer("id").primaryKey(),
  name: text("name", { length: 255 }).notNull(),
});

export const plantArkSchema = createInsertSchema(plants);
