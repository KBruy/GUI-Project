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
- Przełączniki „Siatka” i „Przyciąganie” są w pasku narzędzi (`features/map-editor/components/GridToggles.tsx`), a ich stan w store (`gridVisible`, `gridSnap`). Przyciąganie działa przy dodawaniu z palety (F-31), przy przeciąganiu i przy strzałkach (F-33).

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

## Narzędzia

`features/map-editor/components/ToolPanel.tsx` w lewym panelu, nad paletą. Narzędzie jest w store (`tool`), skróty w `useEditorShortcuts.ts`. Esc zawsze wraca do zaznaczania.

- Zaznaczanie (V): klikanie, prostokąt zaznaczania, przeciąganie i uchwyty. Tylko w tym narzędziu działa `useSelectionControls` i widać uchwyty.
- Pędzel (B): maluje assetem wybranym w palecie (opis niżej).
- Prostokąt (R): przeciągnięcie po mapie wypełnia assetem z palety wszystkie wolne pola od miejsca wciśnięcia do kursora. Pole ma rozmiar assetu (przy przyciąganiu zaokrąglony w górę do siatki), zajęte pola i pola poza mapą są pomijane. Podgląd jak przy pędzlu, całość to jeden krok cofania, Esc w trakcie porzuca prostokąt.
- Wiadro (G): kliknięcie w mapę wypełnia assetem z palety wszystkie wolne pola całej mapy (te same pola co przy prostokącie od lewego górnego rogu). Bez podglądu pod kursorem, jeden krok cofania.
- Gumka (E): `features/map-editor/useEraser.ts`. Wciśnięty przycisk i ruch po mapie usuwają obiekt pod kursorem (najwyższy, jak przy zaznaczaniu). Na ekranie znika od razu, ze sceny po puszczeniu przycisku, jednym krokiem cofania. Esc w trakcie porzuca pociągnięcie. Klik w kafelek palety przy gumce włącza pędzel.
- Ikony kursora (`Cursor`) i prostokąta (`RectFill`) są narysowane w `customIcons.ts` w formacie Pxlkit, bo paczki ich nie mają.

## Paleta assetów

`features/map-editor/components/AssetPalette.tsx` w lewym panelu edytora (F-31).

- Przy pierwszym wyświetleniu woła `loadAssets()` ze store'u: `GET /api/assets?module=map`. Stan ładowania jest w store (`assetsStatus`, `assetsError`), przy błędzie paleta pokazuje komunikat i przycisk „Spróbuj ponownie”.
- Kategorie (zakładki `SegmentedControl`) są w kolejności z manifestu. Etykieta to klucz `categories.<module>.<category>`, nazwa assetu to jego `nameKey`. Brak klucza w słowniku = pokazujemy surowy tekst, więc nowy asset od Moniki nie psuje widoku.
- Kafelek (`OptionTile`) ma obrazek z `assetUrl(file)` (`shared/lib/assets.ts`) i dymek „nazwa · szer.×wys.”. Bez sceny kafelki są wyłączone.
- Kliknięcie: kafelek staje się assetem narzędzi (`brush` w store), a przy zaznaczaniu od razu włącza się pędzel (kafelek wciśnięty). Nad mapą podgląd jedzie za kursorem (kursor krzyżyk), a kliknięcie w mapę stawia obiekt. Z wciśniętym przyciskiem pędzel maluje: obiekt staje w każdym wolnym miejscu pod kursorem (`planAdd` z listą już namalowanych). Całe pociągnięcie trafia do sceny po puszczeniu przycisku, jednym poleceniem `addObjects` (`addPainted` w store), więc Ctrl+Z cofa je naraz. Zajęte pierwsze miejsce = toast, dalej zajęte miejsca są pomijane. Esc w trakcie malowania porzuca pociągnięcie.
- Przeciągnięcie na mapę: bez systemowego drag&drop. Paleta ustawia `placingAsset` w store, a `features/map-editor/usePalettePlacing.ts` śledzi kursor w całym oknie. Poza mapą przy kursorze jedzie obrazek assetu, nad mapą podgląd obiektu z przyciąganiem, bursztynową ramką przy kolizji i etykietą (x, y). Puszczenie nad mapą woła `addAsset(asset, punkt)`, a puszczenie poza mapą (także na pustym pasie canvasu) albo Esc anuluje. Tu nie szukamy innego miejsca: kolizja = toast.
- Zasady stawiania (`placeAsset` w store): przy włączonym przyciąganiu lewy górny róg trafia na siatkę, obiekt zawsze mieści się w mapie, a `x`, `y` obiektu to jego środek.
- `<img>` w `OptionTile` ma `crossOrigin="anonymous"` tak jak `useAssetImage`. Bez tego przeglądarka zapamiętuje obrazek bez nagłówków CORS i canvas nie może go potem wczytać (zamiast grafiki widać czerwone prostokąty).

Zastępcze grafiki (figury z literą) i `assets/manifest.json` są w katalogu `assets/` w głównym folderze repo, do czasu grafik Moniki. Backend czyta manifest tylko przy starcie, więc po zmianie manifestu trzeba go zrestartować.

## Zaznaczanie

Zaznaczenie to `selectedIds` w store (F-32), więc widzą je wszystkie panele. Po cofnięciu dodania obiekt sam wypada z zaznaczenia.

- Store: `selectAt(punkt, toggle)` zaznacza najwyższy obiekt pod punktem sceny i zwraca jego id (albo `null`), `selectInRect(prostokąt, add)` zaznacza wszystko, czego prostokąt dotyka, a `select(ids)` ustawia zaznaczenie wprost. Obiekty z ukrytych warstw pomija silnik (`objectsInRect`).
- Mysz i klawiatura: `features/map-editor/useSelectionControls.ts`. Klik w obiekt zaznacza tylko jego, klik w puste miejsce czyści zaznaczenie. Shift+klik dokłada obiekt albo go zdejmuje. Przeciągnięcie po pustym miejscu (od 3 px) rysuje prostokąt, z Shiftem dokłada do zaznaczenia. Esc czyści zaznaczenie.
- `MapCanvas` woła najpierw `useViewControls`, potem pędzel z `usePalettePlacing`, na końcu `useSelectionControls`. Gdy kliknięcie zaczyna przesuwanie widoku (spacja, środkowy przycisk) albo stawia obiekt pędzlem, ten krok woła `preventDefault`, a kolejne je pomijają.
- Rysowanie: `shared/canvas/SelectionLayer.tsx` jako children `SceneRenderer`. Ramka ma położenie, obrót i skalę obiektu, czerwona linia leży na ciemnym obrysie. Ta sama warstwa rysuje prostokąt zaznaczania. Nie łapie kliknięć.

## Przesuwanie obiektów

Przeciąganie zaznaczonego obiektu przesuwa całe zaznaczenie (F-33), jednym krokiem cofania.

- Logika: `useSelectionControls.ts`. W trakcie store liczy `planMove(wektor, idChwyconego)`: przy przyciąganiu lewy górny róg chwyconego obiektu trafia na siatkę, a wektor jest przycinany tak, żeby cała grupa została w mapie. Silnik sprawdza kolizje bez zmiany sceny (`canExecute`).
- Kolizja w trakcie: ramki obiektów, z którymi grupa by się zderzyła, robią się bursztynowe. Puszczenie na zajęte miejsce zostawia obiekty, pokazuje toast `errors.collision` i potrząsa ramkami (`shakeKey`).
- Strzałki (`useEditorShortcuts.ts`): 1 px, a przy przyciąganiu do następnej linii siatki. Shift+strzałka zawsze przesuwa o 32 px (`moveSelected`). Tu też Ctrl+Z / Cmd+Z cofa, a Ctrl+Shift+Z albo Ctrl+Y ponawia.
- Delete albo Backspace usuwa zaznaczone obiekty, tak samo jak przycisk „Usuń” w pasku narzędzi (`DeleteButton.tsx`, `deleteSelected` w store). Jeden krok cofania, a zaznaczenie znika samo.
- Etykieta (x, y) pokazuje środek obiektu, tak jak dane sceny. Przy przeciąganiu jedzie za kursorem, ale nie wychodzi poza obiekt, a przy prawej i dolnej krawędzi canvasu przechodzi na drugą stronę. Po strzałkach widać ją 1,5 s przy prawym dolnym rogu. Obiekt z etykietą ma w środku kropkę 8 px (`center` w `SelectionLayer`), a kursor nad przeciąganym obiektem znika (`cursor: none`).
- Punkt mapy pod kursorem jest w store (`cursorPoint`) i pokazuje go `CursorPosition` na końcu paska narzędzi. Ruch myszy nie przerysowuje sceny.
- Granice mapy to decyzja frontendu: backend sprawdza tylko środek obiektu. Obiekty wystające za mapę ze scen z backendu dosuwamy przy wczytaniu (F-38).

## Obracanie i skalowanie

Gdy zaznaczony jest dokładnie jeden obiekt na widocznej warstwie, a nic nie jest przeciągane, `MapCanvas` rysuje uchwyty z `shared/canvas/SelectionTransformer.tsx` (F-34).

```tsx
<SelectionTransformer
  object={object}
  bounds={{ width: scene.width, height: scene.height }}
  scaleLimits={{ min: MIN_SCALE, max: MAX_SCALE }}
  onTransform={(t) => transform.onTransform(object.id, t)}
  onTransformEnd={(t) => transform.onTransformEnd(object.id, t)}
/>
```

- Konva `Transformer` zmienia niewidoczny prostokąt o kształcie obiektu, a nie scenę. Komponent tylko podaje `{ x, y, rotation, scaleX, scaleY }` w trakcie i na końcu, a po końcu wraca do obiektu z propsów.
- Uchwyty to kwadraty w kolorach ramki, o boku 1/4 krótszego boku obiektu na ekranie (od 5 do 10 px, żeby przy małym zoomie nie zasłaniały obiektu), ramkę dalej rysuje `SelectionLayer`. Shift przy obrocie skacze co 15°, Shift przy skali trzyma proporcje (oba wbudowane w Konvę). Bez odbicia lustrzanego (`flipEnabled={false}`), bo backend nie przyjmuje ujemnej skali.
- `boundBoxFunc` pilnuje, żeby obrócone narożniki zostały na mapie (pół piksela zapasu na zaokrąglenia), a skala w `scaleLimits` (0,1–10, `MIN_SCALE` i `MAX_SCALE` ze store'u). Pudełko za granicą jest dociągane do niej osobno dla szerokości i wysokości: obiekt na limicie wysokości dalej rośnie w poziomie, a przy szybkim ruchu myszy dochodzi do krawędzi albo limitu, zamiast zatrzymać się przed nią. Uchwyty zostają na ramce.
- Store: `planTransform` (podgląd) i `transformObject` (zapis jednym krokiem cofania). Oba zaokrąglają tak samo: `x`, `y` do 0,5 px, obrót do całych stopni w zakresie 0–359, skala do całych pikseli rozmiaru i w zakresie 0,1–10 (jak w backendzie).
- `features/map-editor/useTransformControls.ts` trzyma podgląd i kolizje. W trakcie ramki kolidujących obiektów są bursztynowe, a przy kolizji na końcu obiekt wraca, jest toast i drżenie ramek, tak jak przy przeciąganiu.
- Kolizje w zaślepce silnika liczą się z prostokąta otaczającego obrócony obiekt, do czasu SAT z #122.

## Testy

jsdom nie rysuje na `<canvas>`, więc `src/test/setup.ts` podmienia `getContext` na zaślepkę, która przyjmuje każde wywołanie. Testy sprawdzają węzły Konvy (pozycja, obrót, kolejność warstw), nie piksele. Stage bierzemy z `Konva.stages.at(-1)`. jsdom nie ma też `ResizeObserver`, więc `setup.ts` daje zaślepkę, która nic nie mierzy. Klikanie, prostokąt, przeciąganie obiektów i z palety testujemy przez `createEvent.pointerDown` itd. z ręcznie ustawionymi `clientX`/`clientY`, bo jsdom ich nie przekazuje, a `setup.ts` daje zaślepkę `setPointerCapture`. Uchwytów Transformera nie da się złapać myszą w jsdom: test zmienia prostokąt sam i wysyła zdarzenia `transform` i `transformend`.
