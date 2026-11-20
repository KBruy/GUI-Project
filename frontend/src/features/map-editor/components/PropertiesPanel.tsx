// Panel „Właściwości” (F-36): co jest zaznaczone na mapie. Jeden obiekt: grafika, warstwa,
// położenie (środek, jak w etykiecie przy przeciąganiu), rozmiar w px sceny, skala i obrót.
// Kilka obiektów: ich liczba.
// Pola zapisują zmianę po Enterze albo wyjściu z pola (jeden krok cofania), a Esc cofa wpisaną
// wartość. Enter i Esc wychodzą też z pola, żeby od razu działały skróty edytora. Gdy obiekt wyszedłby poza mapę albo na inny, pole pokazuje błąd i wraca do wartości.
import { useRef, useState, type KeyboardEvent } from 'react'
import { dictionary, type TranslationKey } from '@/i18n/dictionary'
import { useT } from '@/i18n/language'
import { Stack } from '@/shared/components/layout/Layout'
import { Input } from '@/shared/components/ui/Input/Input'
import type { Transform } from '../engine/engine'
import { useEditorStore } from '../store/editorStore'
import styles from './PropertiesPanel.module.css'

// Do dwóch miejsc po przecinku, bez zbędnych zer (1.5, nie 1.50).
const format = (value: number) => String(Math.round(value * 100) / 100)

interface NumberFieldProps {
  label: string
  value: number
  // Zapisuje wpisaną liczbę. Zwraca klucz błędu albo null.
  onCommit: (value: number) => TranslationKey | null
}

function NumberField({ label, value, onCommit }: NumberFieldProps) {
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
      value={draft ?? format(value)}
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
  const editObject = useEditorStore((s) => s.editObject)

  if (!scene || selectedIds.length === 0) {
    return <p className={styles.message}>{t('properties.empty')}</p>
  }
  if (selectedIds.length > 1) {
    return <p>{`${t('properties.selected')}: ${selectedIds.length}`}</p>
  }

  const layer = scene.layers.find((l) => l.objects.some((o) => o.id === selectedIds[0]))
  const object = layer?.objects.find((o) => o.id === selectedIds[0])
  if (!layer || !object) return null
  // Nazwa z manifestu to klucz słownika. Brak klucza albo assetu → id assetu.
  const nameKey = assets.find((a) => a.id === object.assetId)?.nameKey ?? ''
  const name = Object.hasOwn(dictionary, nameKey) ? t(nameKey as TranslationKey) : object.assetId

  // key z id obiektu: po zmianie zaznaczenia pole zaczyna od nowa (bez starego błędu).
  const field = (
    label: TranslationKey,
    value: number,
    change: (value: number) => Partial<Transform>
  ) => (
    <NumberField
      key={`${object.id}-${label}`}
      label={t(label)}
      value={value}
      onCommit={(next) => editObject(object.id, change(next))}
    />
  )

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
