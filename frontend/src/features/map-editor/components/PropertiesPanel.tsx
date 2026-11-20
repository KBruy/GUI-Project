// Panel „Właściwości” (F-36): co jest zaznaczone na mapie. Jeden obiekt: grafika, warstwa,
// położenie (środek, jak w etykiecie przy przeciąganiu), rozmiar w px sceny, skala i obrót.
// Kilka obiektów: ich liczba, położenie grupy (środek prostokąta wokół nich; zmiana przesuwa
// całą grupę) oraz wspólny obrót i skala (puste pole = różne wartości).
// Pola zapisują zmianę po Enterze albo wyjściu z pola (jeden krok cofania), a Esc cofa wpisaną
// wartość. Enter i Esc wychodzą też z pola, żeby od razu działały skróty edytora. Gdy obiekt
// wyszedłby poza mapę albo na inny, pole pokazuje błąd i wraca do wartości.
import { useRef, useState, type ComponentProps, type KeyboardEvent } from 'react'
import { dictionary, type TranslationKey } from '@/i18n/dictionary'
import { useT } from '@/i18n/language'
import { Stack } from '@/shared/components/layout/Layout'
import { Input } from '@/shared/components/ui/Input/Input'
import type { SceneObject, Transform } from '../engine/engine'
import { groupCenter, MAX_SCALE, MIN_SCALE, useEditorStore } from '../store/editorStore'
import styles from './PropertiesPanel.module.css'

// Do dwóch miejsc po przecinku, bez zbędnych zer (1.5, nie 1.50).
const format = (value: number) => String(Math.round(value * 100) / 100)

// Strzałki w polu liczbowym zmieniają wartość o step i nie wychodzą poza min–max.
// Bez tego strzałka w dół przy skali 0.17 dawała -0.83.
const SCALE_LIMITS = { min: MIN_SCALE, max: MAX_SCALE, step: 0.1 }

interface NumberFieldProps extends Pick<ComponentProps<'input'>, 'min' | 'max' | 'step'> {
  label: string
  // Null: obiekty mają różne wartości, pole jest puste z podpowiedzią.
  value: number | null
  // Zapisuje wpisaną liczbę. Zwraca klucz błędu albo null.
  onCommit: (value: number) => TranslationKey | null
}

function NumberField({ label, value, onCommit, ...limits }: NumberFieldProps) {
  const { t } = useT()
  // Wpisywany tekst. Null = pole pokazuje wartość obiektu (także po zmianie uchwytami).
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<TranslationKey | null>(null)
  // Enter i Esc same kończą edycję, więc wyjście z pola po nich już niczego nie zapisuje.
  const finished = useRef(false)

  function commit() {
    if (draft === null) return
    const number = Number(draft)
    setDraft(null)
    // Puste albo niepoprawne pole po prostu wraca do wartości.
    if (draft.trim() === '' || !Number.isFinite(number) || number === value) return
    setError(onCommit(number))
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return
    if (event.key === 'Enter') commit()
    else {
      setDraft(null)
      setError(null)
    }
    finished.current = true
    event.currentTarget.blur()
  }

  return (
    <Input
      label={label}
      type="number"
      {...limits}
      value={draft ?? (value === null ? '' : format(value))}
      placeholder={value === null ? t('properties.mixed') : undefined}
      error={error ? t(error) : undefined}
      onChange={(event) => {
        setDraft(event.target.value)
        setError(null)
        finished.current = false
      }}
      onBlur={() => {
        if (!finished.current) commit()
        finished.current = false
      }}
      onKeyDown={onKeyDown}
    />
  )
}

export function PropertiesPanel() {
  const { t } = useT()
  const scene = useEditorStore((s) => s.scene)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const assets = useEditorStore((s) => s.assets)
  const editObjects = useEditorStore((s) => s.editObjects)
  const moveGroupTo = useEditorStore((s) => s.moveGroupTo)

  if (!scene || selectedIds.length === 0) {
    return <p className={styles.message}>{t('properties.empty')}</p>
  }

  // key z zaznaczenia: po jego zmianie pole zaczyna od nowa (bez starego błędu).
  const field = (
    label: TranslationKey,
    value: number | null,
    change: (value: number) => Partial<Transform>,
    commit = editObjects
  ) => (
    <NumberField
      key={`${selectedIds.join()}-${label}`}
      label={t(label)}
      value={value}
      onCommit={(next) => commit(selectedIds, change(next))}
      {...(label === 'properties.scaleX' || label === 'properties.scaleY' ? SCALE_LIMITS : {})}
    />
  )

  if (selectedIds.length > 1) {
    const selected = scene.layers
      .flatMap((l) => l.objects)
      .filter((o) => selectedIds.includes(o.id))
    // Wartość wspólna dla wszystkich zaznaczonych albo null, gdy się różnią.
    const shared = (get: (o: SceneObject) => number) =>
      selected.every((o) => get(o) === get(selected[0])) ? get(selected[0]) : null
    const scaleX = shared((o) => o.scaleX)
    const scaleY = shared((o) => o.scaleY)
    const rotation = shared((o) => o.rotation)
    const center = groupCenter(scene, selectedIds)
    return (
      <Stack gap={3}>
        <p>{`${t('properties.selected')}: ${selectedIds.length}`}</p>
        <div className={styles.pairs}>
          {field('properties.x', center?.x ?? null, (x) => ({ x }), moveGroupTo)}
          {field('properties.y', center?.y ?? null, (y) => ({ y }), moveGroupTo)}
          {field('properties.scaleX', scaleX, (value) => ({ scaleX: value }))}
          {field('properties.scaleY', scaleY, (value) => ({ scaleY: value }))}
          {field('properties.rotation', rotation, (value) => ({ rotation: value }))}
        </div>
      </Stack>
    )
  }

  const layer = scene.layers.find((l) => l.objects.some((o) => o.id === selectedIds[0]))
  const object = layer?.objects.find((o) => o.id === selectedIds[0])
  if (!layer || !object) return null
  // Nazwa z manifestu to klucz słownika. Brak klucza albo assetu → id assetu.
  const nameKey = assets.find((a) => a.id === object.assetId)?.nameKey ?? ''
  const name = Object.hasOwn(dictionary, nameKey) ? t(nameKey as TranslationKey) : object.assetId

  return (
    <Stack gap={3}>
      <p>{`${t('properties.asset')}: ${name}`}</p>
      <p>{`${t('properties.layer')}: ${layer.name}`}</p>
      <div className={styles.pairs}>
        {field('properties.x', object.x, (x) => ({ x }))}
        {field('properties.y', object.y, (y) => ({ y }))}
        {field('properties.width', object.width * object.scaleX, (w) => ({
          scaleX: w / object.width,
        }))}
        {field('properties.height', object.height * object.scaleY, (h) => ({
          scaleY: h / object.height,
        }))}
        {field('properties.scaleX', object.scaleX, (scaleX) => ({ scaleX }))}
        {field('properties.scaleY', object.scaleY, (scaleY) => ({ scaleY }))}
        {field('properties.rotation', object.rotation, (rotation) => ({ rotation }))}
      </div>
    </Stack>
  )
}
