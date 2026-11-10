# Silnik w edytorze

Frontend nie zmienia sceny sam. Każdą zmianę robi silnik, a frontend tylko o nią prosi.

## Skąd importować

Zawsze z `@/features/map-editor/engine/engine`. Nigdy wprost z `mockEditor.ts` ani z `@worldsmith/engine`.

Na razie `engine.ts` podaje dalej zaślepkę (`mockEditor.ts`). Gdy Kuba skończy `createEditor`, zmieniamy jeden import w `engine.ts` i reszta aplikacji działa bez zmian. Typy sceny (`Scene`, `Layer`, `SceneObject`) już teraz pochodzą z `@worldsmith/engine`.

## API

```ts
const editor = createEditor(scene)

editor.getScene()                                     // aktualna scena (nowy obiekt po każdej zmianie)
const off = editor.subscribe((scene) => ...)          // off() wypisuje słuchacza
editor.execute(addObject(layerId, asset, { x, y }))   // { ok: true } albo { ok: false, collidesWith: [...] }
editor.execute(transformObjects([id], { x: 320 }))
editor.execute(removeObjects([id]))
editor.canPlace(id, { x, y })                         // to samo co wyżej, ale bez zmiany sceny (podgląd przy przeciąganiu)
editor.undo()
editor.redo()
editor.snapToGrid({ x, y })                           // najbliższy punkt siatki
editor.objectsInRect({ x, y, width, height })         // id obiektów z widocznych warstw
```

## Uproszczenia zaślepki

- Kolizja to zwykłe prostokąty bez obrotu. Stykanie się krawędziami nie jest kolizją.
- Nie sprawdza reguł z rozdz. 5.5 (granice sceny, zakres skali, zablokowane warstwy).
- Cofnij/ponów pamięta kopie całej sceny.

## Store edytora

Komponenty nie trzymają silnika u siebie, tylko biorą go ze store'u Zustand (`features/map-editor/store/editorStore.ts`):

```ts
const scene = useEditorStore((s) => s.scene)          // komponent odświeża się po każdej zmianie sceny
const execute = useEditorStore((s) => s.execute)
execute(addObject(layerId, asset, { x, y }))
```

Store trzyma też zaznaczenie (`selectedIds`), narzędzie (`tool`), aktywną warstwę (`activeLayerId`), `zoom` i `offset` widoku. `loadScene(scene)` tworzy nowy silnik i czyści zaznaczenie.
