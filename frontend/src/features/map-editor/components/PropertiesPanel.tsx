// Panel „Właściwości” (F-36): co jest zaznaczone na mapie. Jeden obiekt: grafika, warstwa,
// położenie (środek, jak w etykiecie przy przeciąganiu), rozmiar w px sceny, skala i obrót.
// Kilka obiektów: ich liczba, położenie grupy (środek prostokąta wokół nich; zmiana przesuwa
// całą grupę) oraz wspólny obrót i skala (puste pole = różne wartości).
// Wartości zmieniają się na bieżąco także w trakcie przeciągania i uchwytów (preview w store).
// Wpisana liczba od razu zmienia mapę, bez Entera. Całe wpisywanie w jednym polu to jeden krok
// cofania, a Esc cofa je w całości. Enter i Esc wychodzą z pola, żeby od razu działały skróty
// edytora. Gdy obiekt wyszedłby poza mapę albo na inny, pole pokazuje błąd, a obiekt zostaje
// przy ostatniej poprawnej wartości.
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
  // Zmienia obiekty na wpisaną liczbę. replace: zastępuje poprzednią zmianę z tego pola,
  // żeby całe wpisywanie było jednym krokiem cofania. Zwraca klucz błędu albo null.
  onChange: (value: number, replace: boolean) => TranslationKey | null
  // Cofa zmianę z tego pola (Esc).
  onRevert: () => void
}

function NumberField({ label, value, onChange, onRevert, ...limits }: NumberFieldProps) {
  const { t } = useT()
  // Wpisywany tekst. Null = pole pokazuje wartość obiektu (także po zmianie uchwytami).
  const [draft, setDraft] = useState<string | null>(null)
  const [error, setError] = useState<TranslationKey | null>(null)
  // Czy wpisywanie w tym polu już zmieniło scenę.
  const changed = useRef(false)

  function change(text: string) {
    setDraft(text)
    const number = Number(text)
    // Puste albo niepoprawne pole niczego nie zmienia, a po wyjściu wraca do wartości.
    if (text.trim() === '' || !Number.isFinite(number) || number === value) return setError(null)
    const result = onChange(number, changed.current)
    if (!result) changed.current = true
    setError(result)
  }

  function finish() {
    setDraft(null)
    changed.current = false
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter' && event.key !== 'Escape') return
    if (event.key === 'Escape') {
      if (changed.current) onRevert()
      setError(null)
    }
    finish()
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
      onChange={(event) => change(event.target.value)}
      onBlur={finish}
      onKeyDown={onKeyDown}
    />
  )
}

export function PropertiesPanel() {
  const { t } = useT()
  // Podczas przeciągania i uchwytów wartości z podglądu, więc zmieniają się na bieżąco.
  const scene = useEditorStore((s) => s.preview ?? s.scene)
  const selectedIds = useEditorStore((s) => s.selectedIds)
  const assets = useEditorStore((s) => s.assets)
  const editObjects = useEditorStore((s) => s.editObjects)
  const moveGroupTo = useEditorStore((s) => s.moveGroupTo)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)

  if (!scene || selectedIds.length === 0) {
    return <p className={styles.message}>{t('properties.empty')}</p>
  }

  // Zmiana z pola na żywo. replace: cofamy poprzednią zmianę z tego pola i robimy nową,
  // a przy błędzie przywracamy tę poprzednią (ostatnią poprawną).
  function live(apply: () => TranslationKey | null, replace: boolean) {
    if (replace) undo()
    const error = apply()
    if (error && replace) redo()
    return error
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
      onChange={(next, replace) => live(() => commit(selectedIds, change(next)), replace)}
      onRevert={undo}
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
