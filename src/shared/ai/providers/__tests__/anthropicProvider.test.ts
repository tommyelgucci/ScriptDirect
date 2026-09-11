import { afterEach, describe, expect, it, vi } from 'vitest'
import { anthropicProvider } from '../anthropicProvider'

const SECTIONS = { strengths: ['Good hook.'], mainIssues: [], missingOrExcess: [], rewritePlan: [] }

describe('anthropicProvider', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the API key and browser-access header, and parses the response text', async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init?: RequestInit) =>
        new Response(JSON.stringify({ content: [{ text: JSON.stringify(SECTIONS) }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await anthropicProvider.analyzeScript({
      apiKey: 'sk-ant-test',
      model: 'claude-sonnet-5',
      scriptText: 'INT. KITCHEN - DAY',
    })

    expect(result).toEqual(SECTIONS)
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('https://api.anthropic.com/v1/messages')
    const headers = init!.headers as Record<string, string>
    expect(headers['x-api-key']).toBe('sk-ant-test')
    expect(headers['anthropic-dangerous-direct-browser-access']).toBe('true')
    const body = JSON.parse(init!.body as string)
    expect(body.model).toBe('claude-sonnet-5')
    expect(body.messages[0].content).toContain('INT. KITCHEN - DAY')
  })

  it('throws a clear error when the request fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 401 })))

    await expect(
      anthropicProvider.analyzeScript({ apiKey: 'bad-key', model: 'claude-sonnet-5', scriptText: '' }),
    ).rejects.toThrow(/401/)
  })
})
