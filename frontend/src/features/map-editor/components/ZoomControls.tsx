// Zoom w pasku narzędzi edytora (F-28): oddal, procent, przybliż, dopasuj do ekranu.
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import { useEditorStore } from '../store/editorStore'
import { ZOOM_STEP } from '../useViewControls'
import { MAX_ZOOM, MIN_ZOOM } from '../view'

export function ZoomControls() {
  const { t } = useT()
  const zoom = useEditorStore((s) => s.zoom)
  const zoomTo = useEditorStore((s) => s.zoomTo)
  const fitToScreen = useEditorStore((s) => s.fitToScreen)

  return (
    <>
      <Button
        size="sm"
        aria-label={t('editor.zoomOut')}
        disabled={zoom <= MIN_ZOOM}
        onClick={() => zoomTo(zoom / ZOOM_STEP)}
      >
        −
      </Button>
      <output aria-label={t('editor.zoom')}>{Math.round(zoom * 100)}%</output>
      <Button
        size="sm"
        aria-label={t('editor.zoomIn')}
        disabled={zoom >= MAX_ZOOM}
        onClick={() => zoomTo(zoom * ZOOM_STEP)}
      >
        +
      </Button>
      <Button size="sm" onClick={fitToScreen}>
        {t('editor.fit')}
      </Button>
    </>
  )
}
