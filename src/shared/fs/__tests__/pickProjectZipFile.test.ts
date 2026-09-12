import { afterEach, describe, expect, it, vi } from 'vitest'
import { pickProjectZipFile } from '../pickProjectZipFile'

/**
 * jsdom never opens a real file dialog on `input.click()`, and the input
 * is never attached to the document (so `querySelector` can't find it
 * either). Intercepting `document.createElement` is the only way to get a
 * reference to it, to simulate what the browser would otherwise do:
 * dispatch `change` with a file selected, or `cancel` when dismissed.
 */
function interceptFileInput(): () => HTMLInputElement {
  const originalCreateElement = document.createElement.bind(document)
  let captured: HTMLInputElement | undefined
  vi.spyOn(document, 'createElement').mockImplementation(((tagName: string) => {
    const element = originalCreateElement(tagName)
    if (tagName === 'input') {
      captured = element as HTMLInputElement
    }
    return element
  }) as typeof document.createElement)
  return () => {
    if (!captured) {
      throw new Error('input element not created yet')
    }
    return captured
  }
}

describe('pickProjectZipFile', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('filters to .zip files', () => {
    const getInput = interceptFileInput()
    void pickProjectZipFile()

    const input = getInput()
    expect(input.type).toBe('file')
    expect(input.accept).toBe('.zip,application/zip')
  })

  it('resolves with the selected file on change', async () => {
    const getInput = interceptFileInput()
    const resultPromise = pickProjectZipFile()

    const input = getInput()
    const file = new File(['zip bytes'], 'project.zip', { type: 'application/zip' })
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    input.dispatchEvent(new Event('change'))

    expect(await resultPromise).toBe(file)
  })

  it('resolves null when the picker is dismissed', async () => {
    const getInput = interceptFileInput()
    const resultPromise = pickProjectZipFile()

    getInput().dispatchEvent(new Event('cancel'))

    expect(await resultPromise).toBeNull()
  })
})
