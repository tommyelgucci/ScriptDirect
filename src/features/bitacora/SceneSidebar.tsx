import { useTranslation } from '../../shared/i18n/useTranslation'
import './SceneSidebar.css'
import type { SceneListItem } from './sceneList'

interface SceneSidebarProps {
  scenes: SceneListItem[]
  onSelectScene: (sceneId: string) => void
}

export function SceneSidebar({ scenes, onSelectScene }: SceneSidebarProps) {
  const t = useTranslation()
  return (
    <nav className="scene-sidebar" aria-label={t.sceneSidebar.ariaLabel}>
      <h2>{t.sceneSidebar.title}</h2>
      {scenes.length === 0 && <p className="scene-sidebar__empty">{t.sceneSidebar.empty}</p>}
      <ol>
        {scenes.map((scene, index) => (
          <li key={scene.sceneId ?? index}>
            <button
              type="button"
              disabled={!scene.sceneId}
              onClick={() => scene.sceneId && onSelectScene(scene.sceneId)}
            >
              <span className="scene-sidebar__number">{index + 1}</span>
              <span className="scene-sidebar__heading">{scene.heading}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  )
}
