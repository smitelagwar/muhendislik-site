import * as fs from "node:fs";
import * as path from "node:path";
import type { CadV2SqlExecutor, CadV2SqlStatement } from "./repository";

export function splitCadV2Migration(source: string): CadV2SqlStatement[] {
  return source
    .split(/^\s*--\s*@statement\s*$/m)
    .map((text) => text.trim())
    .filter(Boolean)
    .map((text) => ({ text }));
}

export async function applyCadV2DurableRepositoryMigration(
  executor: CadV2SqlExecutor,
  migrationPath = path.resolve(process.cwd(), "src/lib/cad-v2/db/migrations/001_durable_repository.sql")
): Promise<void> {
  const migrationFiles = fs.readdirSync(path.dirname(migrationPath))
    .filter((entry) => /^\d{3}_.+\.sql$/.test(entry))
    .sort()
    .map((entry) => path.join(path.dirname(migrationPath), entry));
  if (!migrationFiles.includes(migrationPath)) migrationFiles.unshift(migrationPath);

  for (const file of migrationFiles) {
    const source = fs.readFileSync(file, "utf-8");
    const statements = splitCadV2Migration(source);
    const version = path.basename(file, ".sql");
    if (!statements.length || !source.includes(version)) {
      throw new Error(`CAD_V2_MIGRATION_INVALID: ${version} migration içeriği yok.`);
    }
    if (version === "001_durable_repository" && statements.length < 20) {
      throw new Error("CAD_V2_MIGRATION_INVALID: durable repository temel migration içeriği eksik.");
    }
    await executor.transaction(statements);
  }
}
