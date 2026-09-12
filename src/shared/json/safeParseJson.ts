import type { z } from 'zod'

export type SafeJsonParseResult<T> = { success: true; data: T } | { success: false; error: unknown }

/**
 * Combines JSON.parse and a Zod schema's safeParse into one step that never
 * throws. Every sidecar reader in this codebase already has a documented
 * fallback for schema-invalid JSON (start fresh, show empty, etc.), but
 * calling `schema.safeParse(JSON.parse(text))` directly meant a
 * syntactically invalid file (truncated, hand-edited) threw inside
 * JSON.parse before safeParse ever ran, skipping that fallback entirely —
 * Codex's review flagged this same gap independently on
 * episodeMeta.ts, syncCharacters.ts, syncLocations.ts, versionHistory.ts,
 * and ConstelacionScreen.tsx. This treats a syntax error exactly like a
 * schema-invalid result so every caller's existing fallback covers both.
 */
export function safeParseJson<T>(schema: z.ZodType<T>, text: string): SafeJsonParseResult<T> {
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch (error) {
    return { success: false, error }
  }
  const parsed = schema.safeParse(value)
  return parsed.success ? { success: true, data: parsed.data } : { success: false, error: parsed.error }
}
