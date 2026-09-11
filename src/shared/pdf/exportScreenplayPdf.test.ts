import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'
import { parseFountainDocument } from '../fountain'
import { exportScreenplayPdf } from './exportScreenplayPdf'

const SHORT_SCRIPT = `INT. KITCHEN - DAY

[[id:scn_aaaaaaaaaaaa]]

Morty stares at the knife.

MORTY
(quietly)
You were never supposed to see that.`

describe('exportScreenplayPdf', () => {
  it('produces a valid PDF with a title page plus one body page for a short script', async () => {
    const scenes = parseFountainDocument(SHORT_SCRIPT)
    const bytes = await exportScreenplayPdf('My Project', scenes)

    expect(Buffer.from(bytes.slice(0, 5)).toString()).toBe('%PDF-')

    const loaded = await PDFDocument.load(bytes)
    expect(loaded.getPageCount()).toBe(2)
  })

  it('paginates a long script across multiple body pages', async () => {
    const longScript = [
      'INT. WAREHOUSE - NIGHT',
      '',
      '[[id:scn_bbbbbbbbbbbb]]',
      '',
      ...Array.from({ length: 120 }, (_, i) => `Beat number ${i}, a full sentence of action to fill the page.\n`),
    ].join('\n')

    const scenes = parseFountainDocument(longScript)
    const bytes = await exportScreenplayPdf('My Project', scenes)
    const loaded = await PDFDocument.load(bytes)

    expect(loaded.getPageCount()).toBeGreaterThan(3)
  })

  it('does not throw for a script with no scenes yet', async () => {
    const bytes = await exportScreenplayPdf('Empty Project', [])
    const loaded = await PDFDocument.load(bytes)
    expect(loaded.getPageCount()).toBe(2)
  })
})
