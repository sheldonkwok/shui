import { getTableConfig, PgTable } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";
import * as schema from "./schema.ts";

const tables = Object.values(schema).filter((value) => value instanceof PgTable);

describe("schema", () => {
  it("has tables", () => {
    expect(tables.length).toBeGreaterThan(0);
  });

  it.each(tables.map((table) => [getTableConfig(table).name, table] as const))(
    "%s enables row-level security",
    (_name, table) => {
      expect(getTableConfig(table).enableRLS).toBe(true);
    },
  );
});
