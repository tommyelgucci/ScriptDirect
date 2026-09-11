import { z } from 'zod'
import { blockSchema } from './block'
import { idSchema } from './id'

/**
 * A Scene is the runtime/parsed representation of a slugline and its
 * content. The screenplay text itself lives in the episode's .fountain
 * file; this shape is what the app works with in memory and what the
 * sidecar .meta.json links other entities (SceneMetric, Beat, ...) to via
 * `id`, matching the `[[id:scn_xxxx]]` Fountain note convention.
 */
export const sceneSchema = z
  .object({
    id: idSchema('scn'),
    order: z.number().int().nonnegative(),
    sceneNumber: z.string().optional(),
    blocks: z.array(blockSchema).min(1),
  })
  .refine((scene) => scene.blocks[0]?.type === 'heading', {
    message: 'The first block of a scene must be its heading',
    path: ['blocks', 0, 'type'],
  })
export type Scene = z.infer<typeof sceneSchema>
