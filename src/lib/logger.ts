type Level = "info" | "warn" | "error";

type Event =
  | "auth_signup"
  | "upload"
  | "reclassify"
  | "ai_insight"
  | "unauthorized"
  | "rate_limited"
  | "validation_error"
  | "server_error"
  | "file_delete";

export function log(
  level: Level,
  event: Event,
  data: Record<string, unknown> = {},
): void {
  const entry = JSON.stringify({
    ts:    new Date().toISOString(),
    level,
    event,
    ...data,
  });
  if (level === "error") console.error(entry);
  else console.log(entry);
}
