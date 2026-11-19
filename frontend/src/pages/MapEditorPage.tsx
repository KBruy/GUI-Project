import { useParams } from 'react-router'
import { useT } from '@/i18n/language'
import { AssetPalette } from '@/features/map-editor/components/AssetPalette'
import { CursorPosition } from '@/features/map-editor/components/CursorPosition'
import { GridToggles } from '@/features/map-editor/components/GridToggles'
import { MapCanvas } from '@/features/map-editor/components/MapCanvas'
import { NewMapButton } from '@/features/map-editor/components/NewMapButton'
import { SaveButton } from '@/features/map-editor/components/SaveButton'
import { ZoomControls } from '@/features/map-editor/components/ZoomControls'
import { useProjectUrl } from '@/features/map-editor/useProjectUrl'
import { EditorLayout, Panel, Sidebar, Toolbar } from '@/shared/components/layout/Layout'

// Edytor map (F-29). Panele warstw (F-35) i właściwości (F-36) są jeszcze puste.
export default function MapEditorPage() {
  const { t } = useT()
  const { id } = useParams()
  useProjectUrl(id)

  return (
    <EditorLayout
      title={t('nav.editor')}
      toolbar={
        <Toolbar label={t('editor.toolbar')}>
          {/* Pod /map/<id> projekt się wczytuje, więc okno „Nowa mapa” nie otwiera się samo. */}
          <NewMapButton autoOpen={!id} />
          <SaveButton />
          <GridToggles />
          <ZoomControls />
          <CursorPosition />
        </Toolbar>
      }
      left={
        <Sidebar side="left" width={280}>
          <Panel title={t('editor.palette')}>
            <AssetPalette />
          </Panel>
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
