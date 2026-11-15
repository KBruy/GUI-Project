// Strona pod /dev/ui — dostępna w każdym buildzie, ale nie linkowana z nawigacji aplikacji.
// Każdy task dopisuje tu sekcję ze swoimi komponentami we wszystkich wariantach.
import { useState } from 'react'
import { useT } from '@/i18n/language'
import { Button } from '@/shared/components/ui/Button/Button'
import type { ButtonVariant, ButtonSize } from '@/shared/components/ui/Button/Button'
import { IconButton } from '@/shared/components/ui/IconButton/IconButton'
import { SegmentedControl } from '@/shared/components/ui/SegmentedControl/SegmentedControl'
import { Input } from '@/shared/components/ui/Input/Input'
import { Select } from '@/shared/components/ui/Select/Select'
import { Slider } from '@/shared/components/ui/Slider/Slider'
import { Tooltip } from '@/shared/components/ui/Tooltip/Tooltip'
import { Modal } from '@/shared/components/ui/Modal/Modal'
import { toast } from '@/shared/components/ui/Toast/toast'
import { OptionTile } from '@/shared/components/ui/OptionTile/OptionTile'
import { Icon } from '@/shared/components/ui/Icon/Icon'
import { Container, Stack, Panel } from '@/shared/components/layout/Layout'

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'danger', 'ghost']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg']

// Przykładowe miniatury do OptionTile (pikselowe SVG 8×8 i 8×4). Prawdziwe assety przyjdą z backendu (F-31).
const pixelSvg = (w: number, h: number, rects: string) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${rects}</svg>`
  )}`
const SAMPLE_TILES = [
  {
    id: 'grass',
    label: 'Trawa',
    imageUrl: pixelSvg(
      8,
      8,
      '<rect width="8" height="8" fill="#7a4a24"/><rect width="8" height="3" fill="#3fa34d"/><rect x="1" y="3" width="2" height="1" fill="#3fa34d"/><rect x="5" y="3" width="1" height="1" fill="#3fa34d"/><rect x="2" y="6" width="1" height="1" fill="#5c3518"/>'
    ),
  },
  {
    id: 'log',
    label: 'Kłoda (2:1)',
    imageUrl: pixelSvg(
      8,
      4,
      '<rect width="8" height="4" fill="#8b5a2b"/><rect y="0" width="8" height="1" fill="#a8743f"/><rect width="2" height="4" fill="#d9b27c"/><rect x="0" y="1" width="1" height="2" fill="#a8743f"/>'
    ),
  },
  {
    id: 'sky',
    label: 'Niebo',
    imageUrl: pixelSvg(
      8,
      8,
      '<rect width="8" height="8" fill="#5fb7ff"/><rect x="1" y="2" width="4" height="2" fill="#fff"/><rect x="2" y="1" width="2" height="1" fill="#fff"/>'
    ),
  },
]

export default function DevUiPage() {
  const { t } = useT()
  const [pressed, setPressed] = useState(false)
  const [tab, setTab] = useState<'projekty' | 'mapy' | 'postacie'>('projekty')
  const [tool, setTool] = useState<'pencil' | 'eraser' | 'bucket'>('pencil')
  const [name, setName] = useState('')
  const [gridSize, setGridSize] = useState('32')
  const [mapSize, setMapSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [scale, setScale] = useState(2)
  const [modalOpen, setModalOpen] = useState(false)
  const [tile, setTile] = useState('grass')

  const mapSizeOptions = [
    { value: 'small' as const, label: 'Mała (16 × 16)' },
    { value: 'medium' as const, label: 'Średnia (32 × 32)' },
    { value: 'large' as const, label: 'Duża (64 × 64)' },
  ]

  const tabOptions = [
    { value: 'projekty' as const, label: 'Projekty' },
    { value: 'mapy' as const, label: 'Mapy' },
    { value: 'postacie' as const, label: 'Postacie' },
  ]

  return (
    <Container>
      <Stack direction="column" gap={5}>
        {/* Motyw i język przełącza się w nagłówku (AppLayout). */}
        <h1>{t('dev.ui.title')}</h1>

        <Panel title="Button / IconButton">
          <Stack direction="column" gap={4}>
            <Stack direction="column" gap={3}>
              <p>Warianty × rozmiary</p>
              {VARIANTS.map((variant) => (
                <Stack key={variant} direction="row" gap={2} wrap>
                  {SIZES.map((size) => (
                    <Button key={size} variant={variant} size={size}>
                      {variant} {size}
                    </Button>
                  ))}
                </Stack>
              ))}
            </Stack>

            <Stack direction="column" gap={3}>
              <p>Z ikoną</p>
              <Stack direction="row" gap={2} wrap>
                <Button icon="Pencil">Edytuj</Button>
                <Button icon="Trash" variant="danger">
                  Usuń
                </Button>
                <Button icon="Download" variant="primary" size="lg">
                  Pobierz
                </Button>
              </Stack>
            </Stack>

            <Stack direction="column" gap={3}>
              <p>Disabled</p>
              <Stack direction="row" gap={2} wrap>
                <Button disabled>secondary disabled</Button>
                <Button variant="primary" disabled>
                  primary disabled
                </Button>
                <Button variant="ghost" disabled>
                  ghost disabled
                </Button>
              </Stack>
            </Stack>

            <Stack direction="column" gap={3}>
              <p>Pressed (toggle — kliknij, żeby przełączyć)</p>
              <Stack direction="row" gap={2}>
                <Button pressed={pressed} onClick={() => setPressed((p) => !p)}>
                  {pressed ? 'Wciśnięty' : 'Normalny'}
                </Button>
              </Stack>
            </Stack>

            <Stack direction="column" gap={3}>
              <p>IconButton</p>
              <Stack direction="row" gap={2} wrap>
                <IconButton icon="Pencil" label="Edytuj" />
                <IconButton icon="Pencil" label="Edytuj (sm)" size="sm" />
                <IconButton icon="Pencil" label="Edytuj (lg)" size="lg" />
                <IconButton
                  icon="Grid"
                  label="Siatka"
                  pressed={pressed}
                  onClick={() => setPressed((p) => !p)}
                />
                <IconButton icon="Trash" label="Usuń (disabled)" disabled />
              </Stack>
            </Stack>
          </Stack>
        </Panel>

        <Panel title="SegmentedControl">
          <Stack direction="column" gap={4}>
            <Stack direction="column" gap={3}>
              <p>Podstawowy (3 opcje)</p>
              <SegmentedControl
                options={tabOptions}
                value={tab}
                onChange={setTab}
                label="Filtr widoku"
              />
            </Stack>

            <Stack direction="column" gap={3}>
              <p>Z ikonami</p>
              <SegmentedControl
                options={[
                  { value: 'pencil' as const, label: 'Rysuj', icon: 'Pencil' },
                  { value: 'eraser' as const, label: 'Gumka', icon: 'Eraser' },
                  { value: 'bucket' as const, label: 'Wypełnij', icon: 'PaintBucket' },
                ]}
                value={tool}
                onChange={setTool}
                label="Narzędzie"
              />
            </Stack>

            <Stack direction="column" gap={3}>
              <p>Rozmiary</p>
              <SegmentedControl
                options={tabOptions}
                value={tab}
                onChange={setTab}
                label="sm"
                size="sm"
              />
              <SegmentedControl
                options={tabOptions}
                value={tab}
                onChange={setTab}
                label="lg"
                size="lg"
              />
            </Stack>
          </Stack>
        </Panel>

        <Panel title="Tooltip">
          <Stack direction="column" gap={3}>
            <p>Najedź myszą albo przejdź Tabem (pokazuje się po 300 ms, Esc chowa)</p>
            <Stack direction="row" gap={2} wrap>
              <Tooltip text="Zapisuje projekt na serwerze">
                <Button icon="Download">Zapisz</Button>
              </Tooltip>
              <Tooltip text="Długi opis, który zawija się w kilka linijek, żeby sprawdzić maksymalną szerokość dymka">
                <Button>Długi tekst</Button>
              </Tooltip>
            </Stack>
            <p>Przy krawędziach (dymek nie wychodzi poza ekran)</p>
            <Stack direction="row" justify="space-between">
              <IconButton icon="Undo" label="Cofnij przy lewej krawędzi" />
              <IconButton icon="Redo" label="Ponów przy prawej krawędzi" />
            </Stack>
          </Stack>
        </Panel>

        <Panel title="Modal">
          <Stack direction="column" gap={3}>
            <p>
              Esc, kliknięcie w tło i X zamykają okno; Tab nie wychodzi poza nie; fokus wraca na
              przycisk
            </p>
            <Stack direction="row" gap={2}>
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                Otwórz modal
              </Button>
            </Stack>
          </Stack>
          <Modal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            title="Nowa mapa"
            closeLabel="Zamknij"
            actions={
              <>
                <Button onClick={() => setModalOpen(false)}>Anuluj</Button>
                <Button variant="primary" onClick={() => setModalOpen(false)}>
                  Utwórz
                </Button>
              </>
            }
          >
            <Stack direction="column" gap={3}>
              <Input
                label="Nazwa mapy"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
              <Select
                label="Rozmiar mapy"
                options={mapSizeOptions}
                value={mapSize}
                onChange={setMapSize}
              />
            </Stack>
          </Modal>
        </Panel>

        <Panel title="Toast">
          <Stack direction="column" gap={3}>
            <p>Pojawia się w prawym dolnym rogu i znika po 4 s (albo po kliknięciu X)</p>
            <Stack direction="row" gap={2} wrap>
              <Button onClick={() => toast.success('project.saved')}>success</Button>
              <Button onClick={() => toast.error('errors.network')}>error</Button>
              <Button onClick={() => toast.info('common.comingSoon')}>info</Button>
            </Stack>
          </Stack>
        </Panel>

        <Panel title="OptionTile">
          <Stack direction="column" gap={4}>
            <Stack direction="column" gap={3}>
              <p>md (kliknij, żeby zaznaczyć; ostatni bez obrazka = wariant „Brak”)</p>
              <Stack direction="row" gap={3} wrap>
                {SAMPLE_TILES.map((item) => (
                  <OptionTile
                    key={item.id}
                    label={item.label}
                    imageUrl={item.imageUrl}
                    selected={tile === item.id}
                    onClick={() => setTile(item.id)}
                  />
                ))}
                <OptionTile
                  label="Brak"
                  selected={tile === 'none'}
                  onClick={() => setTile('none')}
                />
              </Stack>
            </Stack>
            <Stack direction="column" gap={3}>
              <p>sm (paleta), z tooltipem, z children i disabled</p>
              <Stack direction="row" gap={2} wrap>
                {SAMPLE_TILES.map((item) => (
                  <OptionTile
                    key={item.id}
                    size="sm"
                    label={item.label}
                    imageUrl={item.imageUrl}
                    tooltip={`Dodaj: ${item.label}`}
                    selected={tile === item.id}
                    onClick={() => setTile(item.id)}
                  />
                ))}
                <OptionTile
                  size="sm"
                  label="Wiadro"
                  selected={tile === 'bucket'}
                  onClick={() => setTile('bucket')}
                >
                  <Icon name="PaintBucket" size={16} />
                </OptionTile>
                <OptionTile
                  size="sm"
                  label="Zablokowane"
                  imageUrl={SAMPLE_TILES[0].imageUrl}
                  disabled
                />
              </Stack>
            </Stack>
          </Stack>
        </Panel>

        <Panel title="Input / Select / Slider">
          <Stack direction="column" gap={4}>
            <Input
              label="Nazwa projektu (pusta = błąd)"
              value={name}
              onChange={(event) => setName(event.target.value)}
              error={name ? undefined : 'Pole jest wymagane'}
            />
            <Input
              label="Rozmiar siatki (liczba)"
              type="number"
              min={8}
              step={8}
              value={gridSize}
              onChange={(event) => setGridSize(event.target.value)}
            />
            <Input label="Disabled" value="Nie można edytować" disabled />

            <Select
              label="Rozmiar mapy"
              options={mapSizeOptions}
              value={mapSize}
              onChange={setMapSize}
            />
            <Select
              label="Z błędem"
              options={mapSizeOptions}
              value={mapSize}
              onChange={setMapSize}
              error="Ten rozmiar jest niedostępny"
            />
            <Select
              label="Disabled"
              options={mapSizeOptions}
              value={mapSize}
              onChange={setMapSize}
              disabled
            />

            <Slider label="Skala" min={1} max={4} value={scale} onChange={setScale} />
            <Slider label="Disabled" min={1} max={4} value={scale} onChange={setScale} disabled />
          </Stack>
        </Panel>
      </Stack>
    </Container>
  )
}
