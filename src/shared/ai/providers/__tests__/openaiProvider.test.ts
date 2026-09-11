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
})
