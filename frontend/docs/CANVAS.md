# Canvas (Konva)

Scenę rysujemy biblioteką Konva przez `react-konva`. Kod wspólny dla edytora map i kreatora postaci jest w `src/shared/canvas/`.

## SceneRenderer

```tsx
<SceneRenderer
  scene={scene}
  width={800}
  height={600}
  getAssetUrl={(assetId) => assets[assetId]?.url}
>
  {/* dodatkowe warstwy nad sceną, np. siatka (F-27), zaznaczenie (F-32) */}
</SceneRenderer>
```

- Tylko rysuje, niczego nie zmienia w scenie. Zmiany idą przez store i silnik (`ENGINE.md`).
- Kolejność: tło (`scene.background.color`) → warstwy sceny od indeksu 0 (najniższa) → `children`.
- Ukryte warstwy (`visible: false`) są pomijane.
- Obiekt stoi **środkiem** w `(x, y)`. Konva liczy od lewego górnego rogu, więc ustawiamy `offset` o połowę rozmiaru. Dzięki temu obrót i skala działają wokół środka.
- Każdy węzeł Konvy ma `id` równe id obiektu (`stage.findOne('#<id>')`), a warstwa ma id warstwy sceny.
- Warstwy mają `imageSmoothingEnabled={false}`, więc pixel art po powiększeniu zostaje ostry.
- Bez `getAssetUrl` albo dopóki PNG się ładuje obiekt jest czerwonym prostokątem zastępczym.

## useAssetImage

`useAssetImage(url)` zwraca gotowy `HTMLImageElement` albo `null` (ładuje się, błąd, brak adresu).

- Cache jest wspólny dla całej aplikacji: ten sam adres ładuje się raz.
- `crossOrigin = 'anonymous'`: obrazy z backendu (inny port) nie blokują eksportu canvasu do PNG. Backend musi wysyłać nagłówki CORS dla `/static`.

## Edytor map

`features/map-editor/components/MapCanvas.tsx` bierze scenę ze store'u i podaje ją do `SceneRenderer`. Do czasu okna „Nowa mapa” (F-30) bez sceny ładuje `demoScene.ts`.

## Testy

jsdom nie rysuje na `<canvas>`, więc `src/test/setup.ts` podmienia `getContext` na zaślepkę, która przyjmuje każde wywołanie. Testy sprawdzają węzły Konvy (pozycja, obrót, kolejność warstw), nie piksele. Stage bierzemy z `Konva.stages.at(-1)`.
