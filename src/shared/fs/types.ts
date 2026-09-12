/**
 * Read/write access to a single ScriptDirect project folder, matching the
 * layout defined in ARCHITECTURE.md:
 *
 *   my-project/
 *     project.json
 *     characters.json
 *     episodes/
 *       s01e10.fountain
 *       s01e10.meta.json
 *
 * All methods work with raw file text; parsing and Zod validation happen in
 * the entities layer, not here.
 */
export interface ProjectFileSystem {
  readonly projectName: string

  readProjectJson(): Promise<string | null>
  writeProjectJson(content: string): Promise<void>

  readCharactersJson(): Promise<string | null>
  writeCharactersJson(content: string): Promise<void>

  /**
   * Not in ARCHITECTURE.md's original example folder tree, but follows the
   * exact same pattern as characters.json — ARCHITECTURE.md's data model
   * lists Location as "same pattern as Character", so it gets the same
   * sidecar file.
   */
  readLocationsJson(): Promise<string | null>
  writeLocationsJson(content: string): Promise<void>

  /**
   * Cuaderno (development documents) — same "JSON array sidecar at the
   * project root" pattern as characters.json/locations.json.
   */
  readCuadernoJson(): Promise<string | null>
  writeCuadernoJson(content: string): Promise<void>

  /** File names as they appear on disk, e.g. ["s01e10.fountain"]. */
  listEpisodeFountainFileNames(): Promise<string[]>
  readEpisodeFountain(fountainFileName: string): Promise<string>
  writeEpisodeFountain(fountainFileName: string, content: string): Promise<void>

  /** null when the episode has no sidecar metadata yet. */
  readEpisodeMeta(fountainFileName: string): Promise<string | null>
  writeEpisodeMeta(fountainFileName: string, content: string): Promise<void>

  /**
   * Version snapshots, under versions/<episode base name>/ per
   * ARCHITECTURE.md's folder layout. The index (null when no snapshot has
   * ever been saved) tracks id/label/timestamp per snapshot file; the
   * snapshot itself is a plain .fountain text file.
   */
  readVersionsIndexJson(fountainFileName: string): Promise<string | null>
  writeVersionsIndexJson(fountainFileName: string, content: string): Promise<void>
  readVersionFountain(fountainFileName: string, versionFileName: string): Promise<string>
  writeVersionFountain(fountainFileName: string, versionFileName: string, content: string): Promise<void>
}
