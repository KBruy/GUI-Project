import { useT } from '@/i18n/language'
import { MapCanvas } from '@/features/map-editor/components/MapCanvas'
import { EditorLayout, Panel, Sidebar, Toolbar } from '@/shared/components/layout/Layout'

// Edytor map (F-29). Panele są na razie puste: paleta (F-31), warstwy (F-35), właściwości (F-36).
export default function MapEditorPage() {
  const { t } = useT()

  return (
    <EditorLayout
      title={t('nav.editor')}
      toolbar={<Toolbar label={t('editor.toolbar')} />}
      left={
        <Sidebar side="left" width={240}>
          <Panel title={t('editor.palette')} />
        </Sidebar>
      }
      right={
        <Sidebar side="right" width={280}>
          <Panel title={t('editor.layers')} />
          <Panel title={t('editor.properties')} />
        </Sidebar>
      }
    >
      <MapCanvas />
    </EditorLayout>
  )
}
