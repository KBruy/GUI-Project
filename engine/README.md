# Engine

Silnik edytora (`@worldsmith/engine`): pozycjonowanie, kolizje, warstwy, cofnij i ponów.
Czysty TypeScript, bez Reacta i DOM-u. Testy: `npm test -w engine`.

## Przykład użycia

```ts
import {
  addObject,
  createEditor,
  createMapScene,
  MAP_SIZES,
  transformObjects,
} from '@worldsmith/engine'

const editor = createEditor(createMapScene('Moja mapa', MAP_SIZES[0]))
const unsubscribe = editor.subscribe((scene) => console.log(scene.layers))

const layerId = editor.getScene().layers[0].id
const grass = { id: 'map_terrain_grass_01', width: 32, height: 32 }
editor.execute(addObject(layerId, grass, { x: 48, y: 48 })) // { ok: true }

editor.canPlace(objectId, { x: 64 }) // { ok: false, collidesWith: ['obj_...'] } przy kolizji
editor.execute(transformObjects([objectId], { rotation: 90 }))
editor.undo()
editor.redo()

editor.snapToGrid({ x: 40, y: 70 }) // { x: 32, y: 64 }
editor.objectsInRect({ x: 0, y: 0, width: 200, height: 100 }) // id zaznaczonych obiektów
unsubscribe()
```

## Zasady

- Każda zmiana sceny to polecenie z `apply` i `undo`. Jedno polecenie to jeden krok cofania.
- Polecenie z kolizją nie zmienia sceny i nie trafia do historii.
- Polecenia na zablokowanej warstwie rzucają `EngineError('LAYER_LOCKED')`.
