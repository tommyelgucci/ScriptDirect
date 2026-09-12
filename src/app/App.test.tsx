import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  beforeEach(() => {
    window.location.hash = ''
    // Simulate a Chromium-based browser so the File System Access API path
    // (rather than the Safari/Firefox .zip fallback) is what's under test here.
    ;(window as { showDirectoryPicker?: unknown }).showDirectoryPicker = async () => {
      throw new Error('not used in these tests')
    }
  })

  afterEach(() => {
    window.location.hash = ''
    delete (window as { showDirectoryPicker?: unknown }).showDirectoryPicker
  })

  it('renders the home screen at the default route', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'ScriptDirect' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /abrir carpeta de proyecto/i })).toBeInTheDocument()
  })

  it('redirects /editor back to home when no project is open', () => {
    window.location.hash = '#/editor'
    render(<App />)
    expect(screen.getByRole('button', { name: /abrir carpeta de proyecto/i })).toBeInTheDocument()
  })
})
