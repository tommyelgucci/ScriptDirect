import { z } from 'zod'
import { idSchema } from './id'

/** Ruta: which of the three acts a scene belongs to. */
export const actSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
export type Act = z.infer<typeof actSchema>

/**
 * Ruta: the structural layer over Scenes. One Beat per scene it has been
 * assigned to, linking a scene to an act and an optional label (e.g.
 * "Inciting Incident", "Midpoint", "Climax"). A scene with no Beat entry
 * hasn't been placed on the timeline yet.
 */
export const beatSchema = z.object({
  sceneId: idSchema('scn'),
  act: actSchema,
  label: z.string().default(''),
})
export type Beat = z.infer<typeof beatSchema>
