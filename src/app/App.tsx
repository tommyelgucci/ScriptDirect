import { useAppStore } from '../shared/store/useAppStore'
import './App.css'

function App() {
  const uiLanguage = useAppStore((state) => state.uiLanguage)

  return (
    <main className="app-shell">
      <h1>ScriptDirect</h1>
      <p>Local-first screenwriting suite. Project scaffold in progress.</p>
      <p className="app-shell__language">UI language: {uiLanguage}</p>
    </main>
  )
}

export default App
