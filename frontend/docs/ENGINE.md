# Silnik w edytorze

Frontend nie zmienia sceny sam. Każdą zmianę robi silnik, a frontend tylko o nią prosi.

## Skąd importować

Zawsze z `@/features/map-editor/engine/engine`, nigdy wprost z `@worldsmith/engine`.

`engine.ts` podaje dalej prawdziwy silnik Kuby (`engine/` w repo). Zaślepka `mockEditor.ts` była tu do czasu `createEditor` i została usunięta. Gdy API silnika się zmieni, poprawiamy tylko `engine.ts`.

## API

```ts
const editor = createEditor(scene)

editor.getScene()                                     // aktualna scena (nowy obiekt po każdej zmianie)
const off = editor.subscribe((scene) => ...)          // off() wypisuje słuchacza
editor.execute(addObject(layerId, asset, { x, y }))   // { ok: true } albo { ok: false, collidesWith: [...] }
editor.execute(transformObjects([id], { x: 320 }))
editor.execute(moveObjects(ids, { x: 32, y: 0 }))     // przesuwa kilka obiektów o ten sam wektor, jeden krok cofania
editor.execute(removeObjects([id]))
editor.canPlace(id, { x, y })                         // to samo co wyżej, ale bez zmiany sceny (podgląd przy przeciąganiu)
editor.canExecute(moveObjects(ids, delta))            // wynik dowolnego polecenia bez zmiany sceny
editor.undo()
editor.redo()
editor.snapToGrid({ x, y })                           // najbliższy punkt siatki
editor.objectsInRect({ x, y, width, height })         // id obiektów z widocznych i niezablokowanych warstw
editor.canUndo() / editor.canRedo()                   // czy jest co cofnąć / ponowić
combineCommands([a, b])                               // kilka poleceń jako jeden krok cofania
```

Polecenie to obiekt `{ apply, undo }`, a nie funkcja. Kolizje silnik liczy dokładnie (SAT na obróconych obiektach), a stykanie się krawędziami nie jest kolizją.

## Czego silnik nie robi, a robi frontend

- Granice mapy: obiekt w całości na mapie (`placeAsset`, `clampMove` w store). Backend sprawdza tylko środek.
- Zaokrąglenia do pełnych pikseli i zakres skali 0,1–10 (`normalizeTransform`).

## Store edytora

Komponenty nie trzymają silnika u siebie, tylko biorą go ze store'u Zustand (`features/map-editor/store/editorStore.ts`):

```ts
const scene = useEditorStore((s) => s.scene)          // komponent odświeża się po każdej zmianie sceny
const execute = useEditorStore((s) => s.execute)
execute(addObject(layerId, asset, { x, y }))
```

Store trzyma też zaznaczenie (`selectedIds`), narzędzie (`tool`), aktywną warstwę (`activeLayerId`), `zoom` i `offset` widoku. `loadScene(scene)` tworzy nowy silnik i czyści zaznaczenie.
