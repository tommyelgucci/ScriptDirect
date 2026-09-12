export function buildSceneMetricsPrompt(scriptText: string): string {
  return `You are a professional script analyst measuring per-scene dramatic metrics for a screenplay written in Fountain format.

Each scene in the script is tagged right after its heading with a note like [[id:scn_7f2a9c]]. For EVERY such scene id found in the script, produce one scoring entry.

Respond with ONLY a single JSON array (no markdown code fences, no commentary before or after) matching exactly this shape:
[{"sceneId": string, "emotionalIntensity": number, "dramaticTension": number, "attentionCapture": number, "commercialPotential": number, "dominantEmotion": string}]

Each numeric score is 0-100. Copy sceneId exactly from the script's [[id:...]] notes — do not invent, omit, or reorder any.

SCREENPLAY:
"""
${scriptText}
"""`
}
