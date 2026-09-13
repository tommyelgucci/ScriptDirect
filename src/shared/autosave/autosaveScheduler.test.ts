import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createAutosaveScheduler } from './autosaveScheduler'

describe('createAutosaveScheduler', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('debounces multiple schedule() calls into a single save of the latest value', async () => {
    const save = vi.fn(async (_value: string) => {})
    const scheduler = createAutosaveScheduler(save, 800)

    scheduler.schedule('a')
    vi.advanceTimersByTime(400)
    scheduler.schedule('b')
    vi.advanceTimersByTime(400)
    scheduler.schedule('c')
    await vi.advanceTimersByTimeAsync(800)

    expect(save).toHaveBeenCalledTimes(1)
    expect(save).toHaveBeenCalledWith('c')
  })

  it('cancel() drops a pending debounced save without ever calling save', async () => {
    const save = vi.fn(async () => {})
    const scheduler = createAutosaveScheduler(save, 800)

    scheduler.schedule('a')
    scheduler.cancel()
    await vi.advanceTimersByTimeAsync(800)

    expect(save).not.toHaveBeenCalled()
  })
})

describe('createAutosaveScheduler — flush()', () => {
  it('reports saving on schedule() and saved once flush()ed', async () => {
    const onStatusChange = vi.fn()
    const scheduler = createAutosaveScheduler(async () => {}, 800, onStatusChange)

    scheduler.schedule('a')
    expect(onStatusChange).toHaveBeenLastCalledWith('saving')

    await scheduler.flush()
    expect(onStatusChange).toHaveBeenLastCalledWith('saved')
  })

  it('reports an error status without throwing when the save rejects', async () => {
    const onStatusChange = vi.fn()
    const scheduler = createAutosaveScheduler(
      async () => {
        throw new Error('disk full')
      },
      800,
      onStatusChange,
    )

    scheduler.schedule('a')
    await scheduler.flush()

    expect(onStatusChange).toHaveBeenLastCalledWith('error')
  })

  it('flush() is a no-op that resolves immediately when nothing is pending', async () => {
    const save = vi.fn(async () => {})
    const scheduler = createAutosaveScheduler(save, 800)

    await expect(scheduler.flush()).resolves.toBeUndefined()
    expect(save).not.toHaveBeenCalled()
  })

  // This is the bug Codex's review flagged in EditorScreen: the debounce
  // timer firing a save, and something else (there, the unmount cleanup)
  // flushing again while that save was still in flight, fired a second
  // concurrent, overlapping save instead of a no-op.
  it('does not fire a second save when flush() is called again while one is already in flight', async () => {
    let resolveFirstSave: (() => void) | undefined
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve
        }),
    )
    const scheduler = createAutosaveScheduler(save, 800)

    scheduler.schedule('a')
    const firstFlush = scheduler.flush() // starts save('a'); it never resolves until we call resolveFirstSave
    await Promise.resolve() // let the microtask that invokes save() run
    expect(save).toHaveBeenCalledTimes(1)

    // Simulate an unmount racing that in-flight save: flush() again with nothing newly scheduled.
    const secondFlush = scheduler.flush()
    await Promise.resolve()
    expect(save).toHaveBeenCalledTimes(1) // still just the one call — no duplicate

    resolveFirstSave?.()
    await Promise.all([firstFlush, secondFlush])
    expect(save).toHaveBeenCalledTimes(1)
  })

  it('runs a save scheduled while one is in flight only after the first one finishes, never interleaved', async () => {
    const order: string[] = []
    let resolveFirstSave: (() => void) | undefined
    const save = vi.fn((value: string) => {
      order.push(`start:${value}`)
      if (value === 'first') {
        return new Promise<void>((resolve) => {
          resolveFirstSave = resolve
        }).then(() => {
          order.push('end:first')
        })
      }
      order.push('end:second')
      return Promise.resolve()
    })
    const scheduler = createAutosaveScheduler(save, 800)

    scheduler.schedule('first')
    const firstFlush = scheduler.flush() // save('first') starts and is paused mid-flight
    await Promise.resolve() // let the microtask that invokes save('first') run

    // A new edit arrives and its own flush (e.g. an export button) is forced before the debounce would fire.
    scheduler.schedule('second')
    const secondFlush = scheduler.flush()
    await Promise.resolve()

    // The second save must not have started yet: the first is still unresolved.
    expect(order).toEqual(['start:first'])

    resolveFirstSave?.()
    await Promise.all([firstFlush, secondFlush])

    expect(order).toEqual(['start:first', 'end:first', 'start:second', 'end:second'])
  })

  // Codex's review flagged this: if save A is still in flight when a newer
  // edit B is scheduled, A finishing must not report 'saved' — B is the
  // latest truth and it's still unsaved. Reporting 'saved' there would
  // flash a false "Guardado" in the UI until B eventually finishes too.
  it('does not report "saved" for an older save if a newer edit was scheduled before it finished', async () => {
    const onStatusChange = vi.fn()
    let resolveFirstSave: (() => void) | undefined
    const save = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveFirstSave = resolve
        }),
    )
    const scheduler = createAutosaveScheduler(save, 800, onStatusChange)

    scheduler.schedule('first')
    const firstFlush = scheduler.flush()
    await Promise.resolve()

    scheduler.schedule('second') // a newer, still-unsaved edit arrives while 'first' is in flight

    resolveFirstSave?.()
    await firstFlush

    expect(onStatusChange).not.toHaveBeenCalledWith('saved')
    // The last call is still 'saving', from scheduling 'second' — 'first' resolving afterward reported nothing.
    expect(onStatusChange).toHaveBeenLastCalledWith('saving')
  })

  it('does report "saved" once the actual latest edit finishes', async () => {
    const onStatusChange = vi.fn()
    const scheduler = createAutosaveScheduler(async () => {}, 800, onStatusChange)

    scheduler.schedule('first')
    await scheduler.flush()
    onStatusChange.mockClear()

    scheduler.schedule('second')
    await scheduler.flush()

    expect(onStatusChange).toHaveBeenLastCalledWith('saved')
  })
})
