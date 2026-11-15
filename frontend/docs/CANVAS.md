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

## GridLayer

```tsx
<SceneRenderer scene={scene} width={width} height={height}>
  {gridVisible && <GridLayer width={scene.width} height={scene.height} size={scene.gridSize} />}
</SceneRenderer>
```

- Linie co `size` px na całej scenie, łącznie z krawędziami.
- Jeden `Shape` z własnym `sceneFunc` zamiast setek `Line`, więc duża mapa nie spowalnia przeciągania.
- `strokeScaleEnabled={false}`: linia ma zawsze 1 px na ekranie, także po zoomie.
- `listening={false}`: siatka nie łapie kliknięć.
- Przełączniki „Siatka” i „Przyciąganie” są w pasku narzędzi (`features/map-editor/components/GridToggles.tsx`), a ich stan w store (`gridVisible`, `gridSnap`). Przyciąganie działa przy dodawaniu z palety (F-31), a użyjemy go też przy przeciąganiu (F-33).

## Zoom i przesuwanie widoku

Widok to `zoom` i `offset` w store: punkt sceny `(x, y)` jest na ekranie w `(offset.x + x * zoom, offset.y + y * zoom)`. `SceneRenderer` dostaje je jako propsy i ustawia na całym `Stage` (skala i pozycja), więc siatka i obiekty skalują się razem.

- Obliczenia są w `features/map-editor/view.ts` (czyste funkcje z testami): `zoomAt` (punkt pod kursorem zostaje w miejscu), `fitView` (cała mapa na środku), `clampZoom` (25–400%), `clampOffset` (zawsze widać co najmniej 64 px mapy).
- Store: `zoomTo(zoom, punkt?)`, `panBy(dx, dy)`, `fitToScreen()`, `setViewport(rozmiar)`. Pierwszy pomiar canvasu i wczytanie sceny dopasowują widok do ekranu.
- Mysz i klawiatura: `features/map-editor/useViewControls.ts`. Kółko = zoom w miejscu kursora, `+`/`−` = zoom w środku, spacja z przeciąganiem albo środkowy przycisk = przesuwanie. Klawisze nie działają w polach formularza.
- Pasek narzędzi: `ZoomControls` (−, procent, +, „Dopasuj”).

## useAssetImage

`useAssetImage(url)` zwraca gotowy `HTMLImageElement` albo `null` (ładuje się, błąd, brak adresu).

- Cache jest wspólny dla całej aplikacji: ten sam adres ładuje się raz.
- `crossOrigin = 'anonymous'`: obrazy z backendu (inny port) nie blokują eksportu canvasu do PNG. Backend musi wysyłać nagłówki CORS dla `/static`.

## Edytor map

`features/map-editor/components/MapCanvas.tsx` bierze scenę ze store'u i podaje ją do `SceneRenderer`. Bez sceny canvas jest pusty. Scenę tworzy okno „Nowa mapa” (`NewMapButton` + `NewMapModal`, F-30), które otwiera się samo przy wejściu na `/map`. Pusta mapa powstaje przez `createMapScene` z silnika Kuby (rozmiary z `MAP_SIZES`, nazwa pierwszej warstwy z tłumaczeń).

Canvas wypełnia komórkę `EditorLayout` (`position: absolute; inset: 0`). Jego rozmiar mierzy `useElementSize()` z `shared/hooks/` (ResizeObserver), więc Stage dopasowuje się do zmiany rozmiaru okna. Przed pierwszym pomiarem (rozmiar 0) Stage się nie renderuje.

## Paleta assetów

`features/map-editor/components/AssetPalette.tsx` w lewym panelu edytora (F-31).

- Przy pierwszym wyświetleniu woła `loadAssets()` ze store'u: `GET /api/assets?module=map`. Stan ładowania jest w store (`assetsStatus`, `assetsError`), przy błędzie paleta pokazuje komunikat i przycisk „Spróbuj ponownie”.
- Kategorie (zakładki `SegmentedControl`) są w kolejności z manifestu. Etykieta to klucz `categories.<module>.<category>`, nazwa assetu to jego `nameKey`. Brak klucza w słowniku = pokazujemy surowy tekst, więc nowy asset od Moniki nie psuje widoku.
- Kafelek (`OptionTile`) ma obrazek z `assetUrl(file)` (`shared/lib/assets.ts`) i dymek „nazwa · szer.×wys.”. Bez sceny kafelki są wyłączone.
- Kliknięcie: `addAsset(asset)` stawia obiekt w środku widoku. Jeśli tam coś stoi, szuka najbliższego wolnego miejsca w kolejnych pierścieniach komórek siatki (do 8). Brak miejsca = toast `errors.collision`.
- Przeciągnięcie na canvas: kafelek wysyła id w `dataTransfer` (typ `ASSET_DRAG_TYPE`), `MapCanvas` przelicza punkt upuszczenia na współrzędne sceny (`toScenePoint` z `view.ts`) i woła `addAsset(asset, punkt)`. Tu nie szukamy innego miejsca: kolizja = toast.
- Zasady stawiania (`placeAsset` w store): przy włączonym przyciąganiu lewy górny róg trafia na siatkę, obiekt zawsze mieści się w mapie, a `x`, `y` obiektu to jego środek.
- `<img>` w `OptionTile` ma `crossOrigin="anonymous"` tak jak `useAssetImage`. Bez tego przeglądarka zapamiętuje obrazek bez nagłówków CORS i canvas nie może go potem wczytać (zamiast grafiki widać czerwone prostokąty).

Zastępcze grafiki (figury z literą) i `assets/manifest.json` są w katalogu `assets/` w głównym folderze repo, do czasu grafik Moniki. Backend czyta manifest tylko przy starcie, więc po zmianie manifestu trzeba go zrestartować.

## Testy

jsdom nie rysuje na `<canvas>`, więc `src/test/setup.ts` podmienia `getContext` na zaślepkę, która przyjmuje każde wywołanie. Testy sprawdzają węzły Konvy (pozycja, obrót, kolejność warstw), nie piksele. Stage bierzemy z `Konva.stages.at(-1)`. jsdom nie ma też `ResizeObserver`, więc `setup.ts` daje zaślepkę, która nic nie mierzy. Przeciąganie z palety testujemy przez `createEvent.drop` z ręcznie ustawionymi `clientX`/`clientY`, bo jsdom ich nie przekazuje.
