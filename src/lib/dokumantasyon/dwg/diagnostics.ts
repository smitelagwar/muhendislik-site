import type {
  DwgDiagnostic,
  DwgDiagnosticCategory,
  DwgDiagnosticPhase,
} from "./types";

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function notificationMessage(event: unknown): string {
  if (!event || typeof event !== "object") return String(event ?? "");
  const candidate = event as Record<string, unknown>;
  const message = candidate.message ?? candidate.Message ?? candidate.error ?? candidate.Error;
  return typeof message === "string" ? message : safeStringify(event);
}

function classify(message: string): DwgDiagnosticCategory {
  if (/not implemented|unsupported|not supported/i.test(message)) {
    return "unsupported-feature";
  }
  if (/partially mapped|not mapped yet|partial mapping/i.test(message)) {
    return "partial-mapping";
  }
  if (/unknown|unlisted object|unlisted entity/i.test(message)) {
    return "unknown-object";
  }
  if (/entry not found|couldn'?t find|missing reference|not found .*dictionary/i.test(message)) {
    return "missing-reference";
  }
  return "library-warning";
}

function diagnosticCode(phase: DwgDiagnosticPhase, category: DwgDiagnosticCategory): string {
  const prefix = phase === "read" ? "DWG_READ" : "DXF_WRITE";
  switch (category) {
    case "unsupported-feature":
      return `${prefix}_UNSUPPORTED_FEATURE`;
    case "partial-mapping":
      return `${prefix}_PARTIAL_MAPPING`;
    case "unknown-object":
      return `${prefix}_UNKNOWN_OBJECT`;
    case "missing-reference":
      return `${prefix}_MISSING_REFERENCE`;
    default:
      return `${prefix}_WARNING`;
  }
}

export function normalizeDiagnostics(
  readMessages: readonly string[],
  writeMessages: readonly string[]
): DwgDiagnostic[] {
  const counts = new Map<string, { phase: DwgDiagnosticPhase; message: string; occurrences: number }>();

  for (const [phase, messages] of [
    ["read", readMessages],
    ["write", writeMessages],
  ] as const) {
    for (const rawMessage of messages) {
      const message = rawMessage.trim();
      if (!message) continue;
      const key = `${phase}\u0000${message}`;
      const current = counts.get(key);
      if (current) current.occurrences += 1;
      else counts.set(key, { phase, message, occurrences: 1 });
    }
  }

  return [...counts.values()]
    .map(({ phase, message, occurrences }) => {
      const category = classify(message);
      return {
        phase,
        category,
        code: diagnosticCode(phase, category),
        message,
        occurrences,
      } satisfies DwgDiagnostic;
    })
    .sort((a, b) =>
      a.phase.localeCompare(b.phase) ||
      a.category.localeCompare(b.category) ||
      a.message.localeCompare(b.message)
    );
}

export function hasHighRiskDiagnostics(diagnostics: readonly DwgDiagnostic[]): boolean {
  return diagnostics.some(
    (item) =>
      item.category === "unsupported-feature" ||
      item.category === "partial-mapping" ||
      item.category === "unknown-object"
  );
}
