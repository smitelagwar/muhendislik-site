// ============================================================================
// DÖKÜMANTASYON MODÜLÜ — VERİTABANI BAĞLANTISI (NEON POSTGRES)
// ============================================================================

import { neon, NeonQueryFunction } from "@neondatabase/serverless";

let cachedSql: NeonQueryFunction<false, false> | null = null;

export function getDb(): NeonQueryFunction<false, false> {
  if (cachedSql) {
    return cachedSql;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL ortam değişkeni tanımlı değil. Lütfen Neon Postgres bağlantısını kontrol edin."
    );
  }

  cachedSql = neon(databaseUrl);
  return cachedSql;
}
