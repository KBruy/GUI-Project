// Panel „Narzędzia” nad paletą: tryb pracy myszą na mapie. Skróty klawiszowe są w useEditorShortcuts.
import { useT } from '@/i18n/language'
import type { TranslationKey } from '@/i18n/dictionary'
import type { IconName } from '@/shared/components/ui/Icon/Icon'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore, type Tool } from '../store/editorStore'
import styles from './ToolPanel.module.css'

const TOOLS: { tool: Tool; icon: IconName; label: TranslationKey }[] = [
  { tool: 'select', icon: 'Cursor', label: 'tools.select' },
  { tool: 'brush', icon: 'Pencil', label: 'tools.brush' },
  { tool: 'rect', icon: 'RectFill', label: 'tools.rect' },
]

export function ToolPanel() {
  const { t } = useT()
  const current = useEditorStore((s) => s.tool)
  const setTool = useEditorStore((s) => s.setTool)
  const hasScene = useEditorStore((s) => s.scene !== null)

  return (
    <div role="group" aria-label={t('editor.tools')} className={styles.tools}>
      {TOOLS.map(({ tool, icon, label }) => (
        <Button
          key={tool}
          size="sm"
          className={styles.tool}
          icon={icon}
          pressed={current === tool}
          disabled={!hasScene}
          onClick={() => setTool(tool)}
        >
          {t(label)}
        </Button>
      ))}
    </div>
  )
}
