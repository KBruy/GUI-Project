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
import type { Scene, SceneObject, Transform } from '../engine/engine'
import { groupCenter, MAX_SCALE, MIN_SCALE, useEditorStore } from '../store/editorStore'
import styles from './PropertiesPanel.module.css'

// Do dwóch miejsc po przecinku, bez zbędnych zer (1.5, nie 1.50).
const format = (value: number) => String(Math.round(value * 100) / 100)

// Strzałki w polu liczbowym zmieniają wartość o step i nie wychodzą poza min–max.
// Bez tego strzałka w dół przy skali 0.17 dawała -0.83.
const SCALE_LIMITS = { min: MIN_SCALE, max: MAX_SCALE, step: 0.1 }
// Szerokość i wysokość w px: te same granice skali, przeliczone na rozmiar grafiki.
const sizeLimits = (size: number) => ({
  min: Math.ceil(MIN_SCALE * size),
  max: Math.floor(MAX_SCALE * size),
  step: 1,
})

type FieldLimits = Pick<ComponentProps<'input'>, 'min' | 'max' | 'step'>

interface FieldOptions extends FieldLimits {
  commit?: (ids: string[], changes: Partial<Transform>) => TranslationKey | null
}

interface NumberFieldProps extends FieldLimits {
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
  // Gotowy tekst błędu pod polem.
  const [error, setError] = useState<string | null>(null)
  // Czy wpisywanie w tym polu już zmieniło scenę.
  const changed = useRef(false)
  // Czy następna zmiana pola pochodzi z klawiatury (cyfra, Backspace, wklejenie). Inaczej to krok
  // strzałką, kółkiem albo przyciskami pola. Sprawdzamy klawisz, bo inputType różni się między
  // przeglądarkami.
  const typed = useRef(false)
  const { min, max } = limits
  const range = `${t('properties.range')}: ${min}–${max}`
  const below = (number: number) => min !== undefined && number < Number(min)
  const above = (number: number) => max !== undefined && number > Number(max)

  // stepped: zmiana strzałką, kółkiem albo przyciskami pola, a nie wpisany tekst.
  function change(text: string, stepped: boolean) {
    setDraft(text)
    const number = Number(text)
    // Puste albo niepoprawne pole niczego nie zmienia, a po wyjściu wraca do wartości.
    if (text.trim() === '' || !Number.isFinite(number) || number === value) return setError(null)
    // Poza granicami pola: tylko komunikat z zakresem, obiekt zostaje.
    const outside = below(number) || above(number)
    const result = outside ? null : onChange(number, changed.current)
    if (!outside && !result) {
      changed.current = true
      return setError(null)
    }
    setError(result ? t(result) : range)
    // Krok, którego obiekt nie przyjął, nie zostaje w polu: liczba stoi przy ostatniej poprawnej.
    // Wpisywany tekst zostaje, bo np. „1” to dopiero początek „150”.
    if (stepped) setDraft(null)
  }

  function finish() {
    setDraft(null)
    changed.current = false
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    typed.current = event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete'
    // Strzałka na granicy niczego nie zmienia, więc mówimy dlaczego.
    const shown = Number(draft ?? value)
    const atLimit =
      (event.key === 'ArrowUp' && max !== undefined && shown >= Number(max)) ||
      (event.key === 'ArrowDown' && min !== undefined && shown <= Number(min))
    if (value !== null && atLimit) setError(range)
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
      error={error ?? undefined}
      onChange={(event) => {
        change(event.target.value, !typed.current)
        typed.current = false
      }}
      onPaste={() => (typed.current = true)}
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
  // Scena po ostatniej zmianie z pola. Gdy zmieniło ją potem coś innego (np. przeciąganie
  // na mapie), ostatni krok cofania nie jest już nasz i nie wolno go zastąpić.
  const lastLive = useRef<Scene | null>(null)

  if (!scene || selectedIds.length === 0) {
    return <p className={styles.message}>{t('properties.empty')}</p>
  }

  const ownLastStep = () => useEditorStore.getState().scene === lastLive.current

  // Zmiana z pola na żywo. replace: cofamy poprzednią zmianę z tego pola i robimy nową,
  // a przy błędzie przywracamy tę poprzednią (ostatnią poprawną).
  function live(apply: () => TranslationKey | null, replace: boolean) {
    const own = replace && ownLastStep()
    if (own) undo()
    const error = apply()
    if (error && own) redo()
    if (!error || own) lastLive.current = useEditorStore.getState().scene
    return error
  }

  // Esc: cofa zmianę z pola, o ile nikt nie zmienił sceny po niej.
  function revert() {
    if (ownLastStep()) undo()
  }

  // key z zaznaczenia: po jego zmianie pole zaczyna od nowa (bez starego błędu).
  const field = (
    label: TranslationKey,
    value: number | null,
    change: (value: number) => Partial<Transform>,
    // Własny zapis (np. przesunięcie grupy) i granice strzałek w polu.
    { commit = editObjects, ...limits }: FieldOptions = {}
  ) => (
    <NumberField
      key={`${selectedIds.join()}-${label}`}
      label={t(label)}
      value={value}
      onChange={(next, replace) => live(() => commit(selectedIds, change(next)), replace)}
      onRevert={revert}
      {...limits}
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
          {field('properties.x', center?.x ?? null, (x) => ({ x }), { commit: moveGroupTo })}
          {field('properties.y', center?.y ?? null, (y) => ({ y }), { commit: moveGroupTo })}
          {field('properties.scaleX', scaleX, (value) => ({ scaleX: value }), SCALE_LIMITS)}
          {field('properties.scaleY', scaleY, (value) => ({ scaleY: value }), SCALE_LIMITS)}
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
        {field(
          'properties.width',
          object.width * object.scaleX,
          (w) => ({ scaleX: w / object.width }),
          sizeLimits(object.width)
        )}
        {field(
          'properties.height',
          object.height * object.scaleY,
          (h) => ({ scaleY: h / object.height }),
          sizeLimits(object.height)
        )}
        {field('properties.scaleX', object.scaleX, (scaleX) => ({ scaleX }), SCALE_LIMITS)}
        {field('properties.scaleY', object.scaleY, (scaleY) => ({ scaleY }), SCALE_LIMITS)}
        {field('properties.rotation', object.rotation, (rotation) => ({ rotation }))}
      </div>
    </Stack>
  )
}
