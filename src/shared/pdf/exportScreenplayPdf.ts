import type { PDFFont, PDFPage } from 'pdf-lib'
import { PDFDocument, StandardFonts } from 'pdf-lib'
import { DIALOGUE_CONTINUATION_BLOCK_TYPES, type Block, type BlockType } from '../../entities/block'
import type { ParsedScene } from '../fountain'

const PT_PER_INCH = 72
const PAGE_WIDTH = 8.5 * PT_PER_INCH
const PAGE_HEIGHT = 11 * PT_PER_INCH
const TOP_MARGIN = 1 * PT_PER_INCH
const BOTTOM_MARGIN = 1 * PT_PER_INCH
const FONT_SIZE = 12
/** 12pt Courier, single-spaced, is exactly 6 lines per vertical inch — the industry-standard measure. */
const LINE_HEIGHT = PT_PER_INCH / 6

/** Left margin and max width for each block type, in points from the page's left edge. Standard screenplay layout. */
const BLOCK_LAYOUT: Record<BlockType, { left: number; width: number }> = {
  heading: { left: 1.5 * PT_PER_INCH, width: 6 * PT_PER_INCH },
  action: { left: 1.5 * PT_PER_INCH, width: 6 * PT_PER_INCH },
  character: { left: 3.7 * PT_PER_INCH, width: 3 * PT_PER_INCH },
  parenthetical: { left: 3.1 * PT_PER_INCH, width: 2.3 * PT_PER_INCH },
  dialogue: { left: 2.5 * PT_PER_INCH, width: 3.5 * PT_PER_INCH },
}
/** Headings and character cues render in caps regardless of how they were typed, per standard format. */
const UPPERCASE_BLOCK_TYPES = new Set<BlockType>(['heading', 'character'])

class ScreenplayLayout {
  private doc: PDFDocument
  private font: PDFFont
  private page!: PDFPage
  private y = 0
  private bodyPageNumber = 0

  private constructor(doc: PDFDocument, font: PDFFont) {
    this.doc = doc
    this.font = font
  }

  static async create(): Promise<ScreenplayLayout> {
    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Courier)
    const layout = new ScreenplayLayout(doc, font)
    layout.startBodyPage()
    return layout
  }

  addTitlePage(projectName: string): void {
    const titlePage = this.doc.insertPage(0, [PAGE_WIDTH, PAGE_HEIGHT])
    const size = 16
    const width = this.font.widthOfTextAtSize(projectName, size)
    titlePage.drawText(projectName, {
      x: (PAGE_WIDTH - width) / 2,
      y: PAGE_HEIGHT * 0.6,
      size,
      font: this.font,
    })
  }

  private startBodyPage(): void {
    this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.bodyPageNumber += 1
    this.y = PAGE_HEIGHT - TOP_MARGIN

    if (this.bodyPageNumber > 1) {
      const label = `${this.bodyPageNumber}.`
      const width = this.font.widthOfTextAtSize(label, FONT_SIZE)
      this.page.drawText(label, {
        x: PAGE_WIDTH - PT_PER_INCH - width,
        y: PAGE_HEIGHT - TOP_MARGIN + LINE_HEIGHT * 2,
        size: FONT_SIZE,
        font: this.font,
      })
    }
  }

  addGap(): void {
    this.y -= LINE_HEIGHT
  }

  wrapText(text: string, maxWidth: number): string[] {
    if (!text) {
      return ['']
    }
    const words = text.split(/\s+/)
    const lines: string[] = []
    let current = ''

    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word
      if (current && this.font.widthOfTextAtSize(candidate, FONT_SIZE) > maxWidth) {
        lines.push(current)
        current = word
      } else {
        current = candidate
      }
    }
    if (current) {
      lines.push(current)
    }
    return lines.length > 0 ? lines : ['']
  }

  drawBlockLines(lines: string[], left: number): void {
    for (const line of lines) {
      if (this.y - LINE_HEIGHT < BOTTOM_MARGIN) {
        this.startBodyPage()
      }
      this.page.drawText(line, { x: left, y: this.y, size: FONT_SIZE, font: this.font })
      this.y -= LINE_HEIGHT
    }
  }

  async save(): Promise<Uint8Array> {
    return this.doc.save()
  }
}

/**
 * Renders scenes/blocks into an industry-standard-format screenplay PDF:
 * Letter page, 12pt Courier (6 lines/inch), standard per-element margins,
 * a minimal centered title page, and page numbers from page 2 on.
 *
 * Simplifications: no widow/orphan control for a dialogue block split
 * across a page break, and no "(MORE)"/"(CONT'D)" continuation markers —
 * both are common refinements in dedicated screenwriting software, out of
 * scope for this MVP export.
 */
export async function exportScreenplayPdf(projectName: string, scenes: ParsedScene[]): Promise<Uint8Array> {
  const layout = await ScreenplayLayout.create()
  layout.addTitlePage(projectName)

  const blocks: Block[] = scenes.flatMap((scene) => scene.blocks)

  blocks.forEach((block, index) => {
    const previous = blocks[index - 1]
    const continuesDialogueBlock =
      previous !== undefined &&
      DIALOGUE_CONTINUATION_BLOCK_TYPES.has(previous.type) &&
      (block.type === 'parenthetical' || block.type === 'dialogue')

    if (index > 0 && !continuesDialogueBlock) {
      layout.addGap()
    }

    const { left, width } = BLOCK_LAYOUT[block.type]
    const text = UPPERCASE_BLOCK_TYPES.has(block.type) ? block.text.toUpperCase() : block.text
    layout.drawBlockLines(layout.wrapText(text, width), left)
  })

  return layout.save()
}
