/**
 * Privacy-safe technical telemetry event schema.
 * Note: Never contains file names, CAD text, user comments, or raw coordinates.
 */
export interface CadTelemetryEvent {
  action: "view_init" | "search" | "save" | "export" | "fallback" | "tool_use";
  toolKind?: string;
  durationBucket?: "<500ms" | "500ms-1s" | "1s-3s" | ">3s";
  itemCountBucket?: "0" | "1-10" | "11-50" | ">50";
  status: "success" | "error" | "conflict";
  errorCode?: string;
}

export function durationToBucket(durationMs: number): "<500ms" | "500ms-1s" | "1s-3s" | ">3s" {
  if (durationMs < 500) return "<500ms";
  if (durationMs <= 1000) return "500ms-1s";
  if (durationMs <= 3000) return "1s-3s";
  return ">3s";
}

export function itemCountToBucket(count: number): "0" | "1-10" | "11-50" | ">50" {
  if (count <= 0) return "0";
  if (count <= 10) return "1-10";
  if (count <= 50) return "11-50";
  return ">50";
}

const telemetryEventsBuffer: CadTelemetryEvent[] = [];

/**
 * Records an anonymized technical telemetry event.
 */
export function recordCadTelemetry(event: CadTelemetryEvent): void {
  // Sanitize: ensure no prohibited fields exist
  const safeEvent: CadTelemetryEvent = {
    action: event.action,
    toolKind: event.toolKind,
    durationBucket: event.durationBucket,
    itemCountBucket: event.itemCountBucket,
    status: event.status,
    errorCode: event.errorCode,
  };

  telemetryEventsBuffer.push(safeEvent);
  if (telemetryEventsBuffer.length > 100) {
    telemetryEventsBuffer.shift();
  }
}

export function getRecordedCadTelemetryEvents(): readonly CadTelemetryEvent[] {
  return [...telemetryEventsBuffer];
}

export function clearCadTelemetryEvents(): void {
  telemetryEventsBuffer.length = 0;
}