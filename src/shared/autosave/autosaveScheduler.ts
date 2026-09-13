/**
 * Debounces calls to `save`, and guarantees writes never overlap.
 *
 * `saveDoc()` isn't atomic — it writes the script, then separately
 * reads-and-rewrites characters.json and locations.json — so two calls in
 * flight at once can interleave their steps and silently drop each other's
 * write (Codex's review flagged this: EditorScreen's unmount cleanup fired
 * a second, fire-and-forget `saveDoc()` whenever it ran while a debounced
 * one from the timer was still in flight, because the pending doc wasn't
 * cleared until the timer's own save actually finished). Every write here
 * is chained onto the same promise instead, so a second `flush()` call
 * during an in-flight save waits its turn rather than racing it — and
 * `flush()` also clears the pending doc synchronously, before the write it
 * triggers has even started, so a caller that flushes twice in a row (e.g.
 * the debounce timer firing right as the component unmounts) only sends
 * one write, not a duplicate.
 *
 * Also guards against a second class of bug Codex's review flagged: if
 * save A is still in flight when a newer edit B gets scheduled, A resolving
 * must not report 'saved' — B is the latest truth and it's still unsaved.
 * Every `schedule()` call bumps a generation counter; a save's completion
 * only reports its status if no newer edit has been scheduled since it
 * started, so the status shown always reflects the most recent edit, not
 * whichever save happened to finish last.
 *
 * Framework-agnostic on purpose: real typing into the tiptap editor this
 * schedules autosaves for can't be driven from jsdom (ProseMirror needs
 * `getClientRects`, which jsdom doesn't implement), so this logic has to be
 * unit-testable on its own, without mounting the editor.
 */
export interface AutosaveScheduler<T> {
  /** Debounce a save of `value`, replacing any not-yet-fired pending one. */
  schedule(value: T): void
  /** Cancel the debounce timer and drop the pending value, if any, without saving it. */
  cancel(): void
  /** Fire the pending save now (if any), chained after any save already in flight. */
  flush(): Promise<void>
}

export function createAutosaveScheduler<T>(
  save: (value: T) => Promise<void>,
  delayMs: number,
  onStatusChange?: (status: 'saving' | 'saved' | 'error') => void,
): AutosaveScheduler<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  let pending: T | null = null
  let writeChain: Promise<void> = Promise.resolve()
  // Bumped by every schedule() — identifies "the newest edit not yet
  // confirmed saved." A save's completion only reports its status if this
  // is still the latest generation; otherwise a newer edit has since been
  // scheduled and the status must stay 'saving' for it, not flip to
  // 'saved' for the older write that just happened to finish first.
  let latestGeneration = 0

  function flush(): Promise<void> {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    const value = pending
    pending = null
    if (value === null) {
      return writeChain
    }
    const generation = latestGeneration
    writeChain = writeChain
      .then(() => save(value))
      .then(() => {
        if (generation === latestGeneration) {
          onStatusChange?.('saved')
        }
      })
      .catch(() => {
        if (generation === latestGeneration) {
          onStatusChange?.('error')
        }
      })
    return writeChain
  }

  function schedule(value: T): void {
    pending = value
    latestGeneration += 1
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
    }
    onStatusChange?.('saving')
    timeoutId = setTimeout(() => {
      void flush()
    }, delayMs)
  }

  function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
    pending = null
  }

  return { schedule, cancel, flush }
}
