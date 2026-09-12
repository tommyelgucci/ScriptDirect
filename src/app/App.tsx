import { HashRouter, Route, Routes } from 'react-router-dom'
import { EditorScreen } from '../features/bitacora/EditorScreen'
import { VersionHistoryScreen } from '../features/bitacora/VersionHistoryScreen'
import { BrujulaScreen } from '../features/brujula/BrujulaScreen'
import { ConstelacionScreen } from '../features/constelacion/ConstelacionScreen'
import { EpisodesScreen } from '../features/episodes/EpisodesScreen'
import { PulsoScreen } from '../features/pulso/PulsoScreen'
import { SettingsScreen } from '../features/settings/SettingsScreen'
import { HomeScreen } from './HomeScreen'

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/episodios" element={<EpisodesScreen />} />
        <Route path="/editor" element={<EditorScreen />} />
        <Route path="/historial" element={<VersionHistoryScreen />} />
        <Route path="/brujula" element={<BrujulaScreen />} />
        <Route path="/constelacion" element={<ConstelacionScreen />} />
        <Route path="/pulso" element={<PulsoScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
    </HashRouter>
  )
}

export default App
