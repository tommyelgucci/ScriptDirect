import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { SceneMetric } from '../../entities/scene-metric'
import { SceneMetricEditor } from './SceneMetricEditor'

const METRIC: SceneMetric = {
  sceneId: 'scn_aaaaaaaaaaaa',
  emotionalIntensity: 40,
  dramaticTension: 30,
  attentionCapture: 60,
  commercialPotential: 20,
  dominantEmotion: 'miedo',
}

describe('SceneMetricEditor', () => {
  it('starts with the metric being edited as the draft', () => {
    render(<SceneMetricEditor metric={METRIC} onSave={vi.fn()} />)

    expect(screen.getByRole('slider', { name: 'Intensidad emocional' })).toHaveValue('40')
    expect(screen.getByLabelText('Emoción dominante')).toHaveValue('miedo')
  })

  it('saves a corrected score without touching the other fields', async () => {
    const onSave = vi.fn()
    render(<SceneMetricEditor metric={METRIC} onSave={onSave} />)

    fireEvent.change(screen.getByRole('slider', { name: 'Intensidad emocional' }), { target: { value: '90' } })
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith({ ...METRIC, emotionalIntensity: 90 })
  })

  it('saves a corrected dominant emotion', async () => {
    const onSave = vi.fn()
    render(<SceneMetricEditor metric={METRIC} onSave={onSave} />)

    const input = screen.getByLabelText('Emoción dominante')
    await userEvent.clear(input)
    await userEvent.type(input, 'alivio')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar' }))

    expect(onSave).toHaveBeenCalledWith({ ...METRIC, dominantEmotion: 'alivio' })
  })

  it('disables saving an empty dominant emotion', async () => {
    const onSave = vi.fn()
    render(<SceneMetricEditor metric={METRIC} onSave={onSave} />)

    const input = screen.getByLabelText('Emoción dominante')
    await userEvent.clear(input)

    expect(screen.getByRole('button', { name: 'Guardar' })).toBeDisabled()
    expect(onSave).not.toHaveBeenCalled()
  })
})
