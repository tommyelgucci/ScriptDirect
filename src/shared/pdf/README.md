# shared/pdf

Industry-standard-format PDF export, built on
[`pdf-lib`](https://pdf-lib.js.org/) per `ARCHITECTURE.md`'s tech stack.

- `exportScreenplayPdf(projectName, scenes)` — Letter page, 12pt Courier
  (6 lines/inch), standard per-element margins (Heading/Action at 1.5in,
  Character at 3.7in, Parenthetical at 3.1in, Dialogue at 2.5in from the
  left edge), a minimal centered title page, and page numbers from page 2
  on. Documented simplifications: no widow/orphan control for a dialogue
  block split across a page break, and no "(MORE)"/"(CONT'D)" markers.
- `downloadBlob(bytes, fileName, mimeType)` — triggers a browser download
  via an object URL; no server round-trip.

Wired up in Bitácora as the "Exportar PDF" button, exporting whatever is
currently in the editor (not necessarily what's last saved to disk).
