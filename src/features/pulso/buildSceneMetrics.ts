import { sceneMetricSchema, type SceneMetric } from '../../entities/scene-metric'
import type { RawSceneMetric } from '../../shared/ai/types'

/**
 * Turns the AI provider's raw scoring array into validated SceneMetric
 * entities, dropping any entry whose sceneId doesn't match a real scene in
 * the script — a defense against the model inventing, misspelling, or
 * duplicating an id (see shared/ai/README.md).
 */
export function buildSceneMetrics(rawMetrics: RawSceneMetric[], validSceneIds: ReadonlySet<string>): SceneMetric[] {
  const metrics: SceneMetric[] = []
  const seen = new Set<string>()

  for (const raw of rawMetrics) {
    if (!validSceneIds.has(raw.sceneId) || seen.has(raw.sceneId)) {
      continue
    }
    const parsed = sceneMetricSchema.safeParse(raw)
    if (parsed.success) {
      metrics.push(parsed.data)
      seen.add(raw.sceneId)
    }
  }

  return metrics
}
