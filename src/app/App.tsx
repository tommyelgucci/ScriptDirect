import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router-dom'
import { HomeScreen } from './HomeScreen'

// Screens load on demand so heavy deps (Recharts, force graph, Tiptap, pdf-lib) stay out of the first paint.
const EditorScreen = lazy(() => import('../features/bitacora/EditorScreen').then((m) => ({ default: m.EditorScreen })))
const VersionHistoryScreen = lazy(() => import('../features/bitacora/VersionHistoryScreen').then((m) => ({ default: m.VersionHistoryScreen })))
const BrujulaScreen = lazy(() => import('../features/brujula/BrujulaScreen').then((m) => ({ default: m.BrujulaScreen })))
const ConstelacionScreen = lazy(() => import('../features/constelacion/ConstelacionScreen').then((m) => ({ default: m.ConstelacionScreen })))
const CuadernoScreen = lazy(() => import('../features/cuaderno/CuadernoScreen').then((m) => ({ default: m.CuadernoScreen })))
const EpisodesScreen = lazy(() => import('../features/episodes/EpisodesScreen').then((m) => ({ default: m.EpisodesScreen })))
const PulsoScreen = lazy(() => import('../features/pulso/PulsoScreen').then((m) => ({ default: m.PulsoScreen })))
const RutaScreen = lazy(() => import('../features/ruta/RutaScreen').then((m) => ({ default: m.RutaScreen })))
const SettingsScreen = lazy(() => import('../features/settings/SettingsScreen').then((m) => ({ default: m.SettingsScreen })))

function App() {
  return (
    <HashRouter>
      <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<HomeScreen />} />
        <Route path="/episodios" element={<EpisodesScreen />} />
        <Route path="/editor" element={<EditorScreen />} />
        <Route path="/historial" element={<VersionHistoryScreen />} />
        <Route path="/brujula" element={<BrujulaScreen />} />
        <Route path="/constelacion" element={<ConstelacionScreen />} />
        <Route path="/pulso" element={<PulsoScreen />} />
        <Route path="/ruta" element={<RutaScreen />} />
        <Route path="/cuaderno" element={<CuadernoScreen />} />
        <Route path="/settings" element={<SettingsScreen />} />
      </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
