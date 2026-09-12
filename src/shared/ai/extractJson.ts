/**
 * Pulls a JSON object or array out of an AI provider's raw text response:
 * a fenced code block, the outermost {...} or [...] span, or the raw text
 * as-is. Models don't always follow "respond with only JSON" exactly.
 */
export function extractJson(text: string): string {
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  if (fenced) {
    return fenced[1].trim()
  }

  const firstBrace = text.indexOf('{')
  const firstBracket = text.indexOf('[')
  const usesArray = firstBracket !== -1 && (firstBrace === -1 || firstBracket < firstBrace)
  const start = usesArray ? firstBracket : firstBrace
  const end = text.lastIndexOf(usesArray ? ']' : '}')

  if (start !== -1 && end > start) {
    return text.slice(start, end + 1)
  }
  return text.trim()
}
