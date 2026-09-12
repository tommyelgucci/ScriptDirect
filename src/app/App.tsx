import { HashRouter, Route, Routes } from 'react-router-dom'
import { EditorScreen } from '../features/bitacora/EditorScreen'
import { BrujulaScreen } from '../features/brujula/BrujulaScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { HomeScreen } from './HomeScreen'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/editor" element={<EditorScreen />} />
        <Route path="/brujula" element={<BrujulaScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </HashRouter>
  )
}

export default App
