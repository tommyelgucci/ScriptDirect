import { afterEach, describe, expect, it, vi } from 'vitest'
import { geminiProvider } from '../geminiProvider'

const SECTIONS = { strengths: [], mainIssues: [], missingOrExcess: ['No B-story.'], rewritePlan: [] }

describe('geminiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the API key as a query param and parses the response text', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(SECTIONS) }] } }] }), {
          status: 200,
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await geminiProvider.analyzeScript({
      apiKey: 'gm-test',
      model: 'gemini-2.0-flash',
      scriptText: 'INT. KITCHEN - DAY',
    })

    expect(result).toEqual(SECTIONS)
    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('/models/gemini-2.0-flash:generateContent')
    expect(url).toContain('key=gm-test')
  })

  it('throws a clear error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 403 })))

    await expect(
      geminiProvider.analyzeScript({ apiKey: 'x', model: 'gemini-2.0-flash', scriptText: '' }),
    ).rejects.toThrow(/403/)
  })

  it('analyzes scene metrics, returning the parsed array', async () => {
    const metrics = [
      {
        sceneId: 'scn_aaaaaaaaaaaa',
        emotionalIntensity: 80,
        dramaticTension: 60,
        attentionCapture: 90,
        commercialPotential: 40,
        dominantEmotion: 'fear',
      },
    ]
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: JSON.stringify(metrics) }] } }] }))),
    )

    const result = await geminiProvider.analyzeSceneMetrics({
      apiKey: 'gm-test',
      model: 'gemini-2.0-flash',
      scriptText: 'INT. KITCHEN - DAY',
    })

    expect(result).toEqual(metrics)
  })
})
