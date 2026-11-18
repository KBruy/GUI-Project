// Pozycja kursora w pasku narzędzi: punkt mapy pod kursorem, w pikselach sceny.
// Poza mapą pokazuje kreski. Punkt ustawia MapCanvas (setCursorPoint w store).
import { useT } from '@/i18n/language'
import { useEditorStore } from '../store/editorStore'
import styles from './CursorPosition.module.css'

export function CursorPosition() {
  const { t } = useT()
  const point = useEditorStore((s) => s.cursorPoint)

  return (
    <output aria-label={t('editor.cursor')} className={styles.position}>
      x {point?.x ?? '–'} · y {point?.y ?? '–'}
    </output>
  )
}
