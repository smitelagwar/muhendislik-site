/**
 * Analiz çıktılarının hangi sözleşme ve kural setiyle üretildiğini izlemek için
 * kullanılan sürüm kimlikleri. Her analiz bu dört kimliği birlikte taşıyarak
 * aynı girdinin hangi motor, kural ve varsayım sözleşmesiyle işlendiğini belirtir.
 */
export const ANALYSIS_SCHEMA_VERSION = "0.3.0" as const;

export const ENGINE_VERSION = "0.4.0" as const;

export const RULE_SNAPSHOT_VERSION = "tr-ruhsat-rules@2026-08-20" as const;

export const ASSUMPTION_POLICY_SNAPSHOT_VERSION = "manual-scenario-v1" as const;
