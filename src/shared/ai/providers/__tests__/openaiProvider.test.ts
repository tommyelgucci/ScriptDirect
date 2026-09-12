import { afterEach, describe, expect, it, vi } from 'vitest'
import { openaiProvider } from '../openaiProvider'

const SECTIONS = { strengths: [], mainIssues: ['Flat second act.'], missingOrExcess: [], rewritePlan: [] }

describe('openaiProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the API key as a bearer token and parses the response content', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(SECTIONS) } }] }), {
          status: 200,
        }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await openaiProvider.analyzeScript({
      apiKey: 'sk-oai-test',
      model: 'gpt-4o',
      scriptText: 'INT. KITCHEN - DAY',
    })

    expect(result).toEqual(SECTIONS)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.openai.com/v1/chat/completions')
    const headers = init!.headers as Record<string, string>
    expect(headers.authorization).toBe('Bearer sk-oai-test')
    const body = JSON.parse(init!.body as string)
    expect(body.model).toBe('gpt-4o')
    expect(body.response_format).toEqual({ type: 'json_object' })
  })

  it('throws a clear error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 429 })))

    await expect(openaiProvider.analyzeScript({ apiKey: 'x', model: 'gpt-4o', scriptText: '' })).rejects.toThrow(
      /429/,
    )
  })

  it('analyzes scene metrics without forcing JSON-object mode (the response is an array)', async () => {
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
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(metrics) } }] })),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await openaiProvider.analyzeSceneMetrics({
      apiKey: 'sk-oai-test',
      model: 'gpt-4o',
      scriptText: 'INT. KITCHEN - DAY',
    })

    expect(result).toEqual(metrics)
    const [, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(init!.body as string)
    expect(body.response_format).toBeUndefined()
  })
})
