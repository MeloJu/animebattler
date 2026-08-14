// Every page that reads a `?error=<code>` query param hand-rolled the same
// `code ? map[code] ?? fallback : null` lookup with its own local map
// (login, register, status, story, and battle via battleErrorMessage).
// Not named `errorMessage`: every call site already declares
// `const errorMessage = ...`, and an export with that name would shadow
// itself in the initializer (a TDZ error).
export function resolveErrorMessage(map: Record<string, string>, code: string | undefined, fallback: string): string | null {
  if (!code) return null
  return map[code] ?? fallback
}
