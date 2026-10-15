# Frontend: taski do prototypu (gotowe do przeklejenia na GitHuba)

Każdy nagłówek `###` to jeden issue. Tytuł wklejasz razem z etykietami `[F][mvp]`, a treść pod nim to opis issue. Assignee: Krystian. Numer `F-xx` służy tylko do rozmowy i do pola „Zależy od”. Na GitHubie każdy task dostanie swój numer `#`.

Ustalenia, z których wychodzimy:
- **Style:** CSS Modules i zmienne CSS, bez Tailwinda.
- **pxlkit:** używamy tylko ikon (`@pxlkit/core` i paczki ikon).
- **Komponenty:** wszystkie są nasze, w `shared/`.
- **Struktura folderów:** zakładamy ją wspólnie dla całego zespołu przed startem, więc nie jest osobnym taskiem.
- **Start:** najwcześniej 19.10. Prezentacja prototypu 24.11.

Plan tygodni:

| Tydzień | Daty | Taski | Cel |
|---|---|---|---|
| 1 | 19–25.10 | F-01 … F-14 | konfiguracja, tokeny, motywy, tłumaczenia |
| 2 | 26.10–1.11 | F-15 … F-25 | komponenty `shared/`, routing, apiClient, zaślepka silnika |
| 3 | 2–8.11 | F-26 … F-33 | canvas i serce edytora: zaznaczanie, przeciąganie z kolizją |
| 4 | 9–15.11 | F-34 … F-41 | transformacje, panele, skróty, zapis, projekty, eksport |
| 5 | 16–22.11 | F-42 … F-47 | kreator postaci, dokumentacja, testy scenariusza |

Tydzień 5 jest ciasny. Jeśli coś się obsunie, w pierwszej kolejności przesuwamy na `final` F-46 (dostępność) i eksport PNG postaci z F-44.

---

## Etap 0: Konfiguracja

### F-01 [F][mvp] Wspólny package.json z npm workspaces
**Co trzeba zrobić**
- W katalogu głównym repo utworzyć `package.json` z `"workspaces": ["frontend", "engine"]`.
- Uzgodnić z Kubą nazwę paczki silnika (`@worldsmith/engine`) i wspólną wersję TypeScript.
- W głównym `package.json` dodać skrypty skrótów, np. `dev` (uruchamia frontend) i `test` (testuje obie paczki).

**Kiedy jest gotowe**
- [ ] `npm install` w katalogu głównym instaluje zależności frontendu i silnika.
- [ ] Frontend może zaimportować `@worldsmith/engine` (nawet jeśli silnik to na razie pusty plik).
- [ ] Kuba zaakceptował zmianę.

**Zależy od:** nic. Uzgodnione z: Kuba.

### F-02 [F][mvp] Projekt Vite + React + TypeScript
**Co trzeba zrobić**
- Utworzyć projekt w `frontend/` (`npm create vite@latest`, szablon `react-ts`).
- Usunąć przykładowy kod Vite (logo, licznik, `App.css`).
- W `tsconfig` włączyć tryb `strict`.

**Kiedy jest gotowe**
- [ ] `npm run dev` pokazuje pustą stronę z napisem „WorldSmith”.
- [ ] `npm run build` kończy się bez błędów.

**Zależy od:** F-01

### F-03 [F][mvp] ESLint, Prettier i skrypty jakości
**Co trzeba zrobić**
- Skonfigurować ESLint (reguły dla React i hooków) i Prettier (jeden wspólny styl).
- Dodać skrypty `lint`, `format` i `typecheck` (`tsc --noEmit`).
- Opcjonalnie dodać plik `.vscode/settings.json` z formatowaniem przy zapisie.

**Kiedy jest gotowe**
- [ ] `npm run lint`, `npm run format` i `npm run typecheck` przechodzą na czystym projekcie.
- [ ] Błąd stylu (np. nieużywana zmienna) jest zgłaszany przez `lint`.

**Zależy od:** F-02

### F-04 [F][mvp] Aliasy importów
**Co trzeba zrobić**
- Dodać alias `@/*` → `src/*` w `tsconfig.json` i w `vite.config.ts`.
- Ten sam alias musi działać w Vitest.

**Kiedy jest gotowe**
- [ ] Import `@/shared/...` działa w kodzie, w buildzie i w testach.
- [ ] W kodzie nie ma importów typu `../../../`.

**Zależy od:** F-02

### F-05 [F][mvp] Testy: Vitest i Testing Library
**Co trzeba zrobić**
- Zainstalować `vitest`, `@testing-library/react`, `@testing-library/jest-dom` i `jsdom`.
- Dodać skrypt `test` i jeden przykładowy test komponentu.

**Kiedy jest gotowe**
- [ ] `npm test` uruchamia testy i przykładowy test przechodzi.
- [ ] Test, który celowo psujemy, faktycznie się wywala.

**Zależy od:** F-02, F-04

### F-06 [F][mvp] Konfiguracja adresu API przez zmienne środowiskowe
**Co trzeba zrobić**
- Utworzyć `config/env.ts`, który czyta `import.meta.env.VITE_API_URL` i ma wartość domyślną `http://localhost:8000`.
- Dodać plik `.env.example` z opisem zmiennych.
- Opisać w `README.md`, jak skopiować `.env.example` do `.env`.

**Kiedy jest gotowe**
- [ ] W kodzie nigdzie nie ma wpisanego na sztywno adresu backendu.
- [ ] Zmiana wartości w `.env` zmienia adres, pod który idą zapytania.

**Zależy od:** F-02

### F-07 [F][mvp] .gitignore
**Co trzeba zrobić**
- Dodać lub uzupełnić `.gitignore`: `CLAUDE.md`, `node_modules/`, `dist/`, `.env`, `coverage/`, `.DS_Store`.

**Kiedy jest gotowe**
- [ ] Po `npm install`, `npm run build` i utworzeniu `CLAUDE.md` polecenie `git status` nie pokazuje tych plików.
- [ ] `.env.example` dalej jest śledzony przez gita.

**Zależy od:** F-02

### F-08 [F][mvp] (opcjonalnie) GitHub Actions dla frontendu
**Co trzeba zrobić**
- Dodać plik `.github/workflows/frontend.yml`, który przy każdym PR uruchamia `npm ci`, `lint`, `typecheck` i `test`.
- Uruchamiać go tylko, gdy zmienia się `frontend/` albo `engine/`.

**Kiedy jest gotowe**
- [ ] W PR widać zielony check, a przy błędzie lintera czerwony.
- [ ] W README jest jedna linijka, co ten check sprawdza.

**Zależy od:** F-03, F-05

---

## Etap 1: Fundamenty wyglądu

### F-09 [F][mvp] Tokeny wyglądu w theme.css
**Co trzeba zrobić**
- Utworzyć `shared/styles/theme.css` ze zmiennymi CSS o nazwach semantycznych:
  - kolory: `--color-bg`, `--color-surface`, `--color-text`, `--color-primary`, `--color-danger`, `--color-border` itd.;
  - odstępy: `--space-1` … `--space-6`;
  - rozmiary fontu: `--font-size-sm` … `--font-size-xl`;
  - pikselowe ramki i cienie: `--pixel-border`, `--pixel-shadow`.
- Krótko opisać każdy token komentarzem.

**Kiedy jest gotowe**
- [ ] Wszystkie tokeny są w jednym pliku.
- [ ] Zmiana `--color-primary` zmienia kolor wszędzie, gdzie jest używany.

**Zależy od:** F-02

### F-10 [F][mvp] Style globalne i font pikselowy
**Co trzeba zrobić**
- Utworzyć `shared/styles/global.css` z resetem (marginesy, `box-sizing`), tłem i kolorem tekstu z tokenów.
- Podłączyć font pikselowy (np. „Press Start 2P” na nagłówki, „VT323” albo czytelny font na tekst).
- Dodać `image-rendering: pixelated` dla ikon.

**Kiedy jest gotowe**
- [ ] Strona wygląda tak samo w Chrome i Firefox.
- [ ] Tekst w panelach jest czytelny przy 1280 px szerokości.

**Zależy od:** F-09

### F-11 [F][mvp] Trzy motywy: jasny, ciemny i kontrastowy
**Co trzeba zrobić**
- W `theme.css` dodać trzy zestawy kolorów pod `[data-theme="light"]`, `[data-theme="dark"]` i `[data-theme="contrast"]`.
- Utworzyć `ThemeProvider` i hook `useTheme()`, które ustawiają `data-theme` na `<html>`.
- Zapisywać wybór w `localStorage`, a przy pierwszym wejściu brać motyw systemu.

**Kiedy jest gotowe**
- [ ] Zmiana motywu przełącza kolory całej aplikacji bez przeładowania strony.
- [ ] Po odświeżeniu strony motyw zostaje.
- [ ] Motyw kontrastowy ma kontrast tekstu co najmniej 7:1 (sprawdzone w DevTools).

**Zależy od:** F-09

### F-12 [F][mvp] Tłumaczenia: słownik, useT i przełącznik języka
**Co trzeba zrobić**
- Utworzyć `i18n/dictionary.ts` (klucz → `{ pl, en }`), `LanguageProvider` i hook `useT()`.
- Ustawić typy tak, żeby `t('zly.klucz')` był błędem TypeScript.
- Zapisywać wybrany język w `localStorage`, domyślnie `pl`.

**Kiedy jest gotowe**
- [ ] Zmiana języka przełącza wszystkie teksty bez przeładowania strony.
- [ ] Literówka w kluczu daje błąd `typecheck`.
- [ ] Jest test hooka `useT` dla obu języków.

**Zależy od:** F-05

### F-13 [F][mvp] Komponent Icon na ikonach pxlkit
**Co trzeba zrobić**
- Zainstalować `@pxlkit/core` i wybrane paczki ikon (np. `ui`, `feedback`).
- Utworzyć `shared/components/ui/Icon.tsx` z propsami `name`, `size` i `label` (dla czytników ekranu).
- W README dopisać informację o autorze ikon (wymóg licencji).

**Kiedy jest gotowe**
- [ ] W kodzie poza `Icon.tsx` nie ma importów z `@pxlkit`.
- [ ] Ikona ma ostre piksele przy każdym rozmiarze.
- [ ] W README jest informacja o autorze ikon.

**Zależy od:** F-10

### F-14 [F][mvp] Animacje wielokrotnego użytku
**Co trzeba zrobić**
- Utworzyć `shared/animations/animations.module.css` z klasami `hoverLift`, `fadeIn` i `shake` (ta ostatnia do kolizji).
- Używać `steps()`, żeby animacje miały „klatkowy”, pikselowy charakter.
- Wyłączać animacje przy `prefers-reduced-motion`.

**Kiedy jest gotowe**
- [ ] Każdą animację da się dodać do komponentu jedną klasą.
- [ ] Przy włączonym w systemie ograniczeniu ruchu animacje się nie odpalają.

**Zależy od:** F-09

---

## Etap 2: Komponenty shared/

### F-15 [F][mvp] Button i IconButton
**Co trzeba zrobić**
- Napisać `Button` z propsami `variant` (`primary`, `secondary`, `danger`, `ghost`), `size` (`sm`, `md`, `lg`), `disabled` i `icon`.
- Napisać `IconButton` (sama ikona, wymagany `label` do tooltipa i czytnika ekranu).
- Dodać pikselowy wygląd: ramka i twardy cień z tokenów, efekt wciśnięcia na `:active`, widoczny fokus.

**Kiedy jest gotowe**
- [ ] Wszystkie warianty i rozmiary wyglądają poprawnie w 3 motywach.
- [ ] Przycisk działa z klawiatury (Tab, Enter, spacja).
- [ ] Jest test: kliknięcie wywołuje `onClick`, a `disabled` go blokuje.

**Zależy od:** F-11, F-13

### F-16 [F][mvp] Pola formularzy: Input, Select i Slider
**Co trzeba zrobić**
- Napisać `Input` (tekst i liczba), `Select` i `Slider`, każdy z `label`, `error` i `disabled`.
- Komunikat błędu przyjmuje klucz tłumaczenia.
- Zachować ten sam pikselowy wygląd co `Button`.

**Kiedy jest gotowe**
- [ ] Każde pole ma powiązaną etykietę (kliknięcie w nią ustawia fokus).
- [ ] Pola działają z klawiatury (strzałki w `Select` i `Slider`).
- [ ] Błąd wyświetla się pod polem w kolorze `--color-danger`.

**Zależy od:** F-12, F-15

### F-17 [F][mvp] Tooltip i Modal
**Co trzeba zrobić**
- Napisać `Tooltip`, który pokazuje się po najechaniu i po fokusie, z krótkim opóźnieniem.
- Napisać `Modal` z tytułem, treścią i przyciskami: zamykanie Esc i kliknięciem w tło, fokus zostaje w środku i wraca po zamknięciu.

**Kiedy jest gotowe**
- [ ] Modal da się w całości obsłużyć bez myszy.
- [ ] Tooltip nie wychodzi poza ekran przy krawędzi.
- [ ] Jest test: Esc zamyka modal.

**Zależy od:** F-15

### F-18 [F][mvp] Komponenty układu: Container, Stack, Panel, Sidebar i Toolbar
**Co trzeba zrobić**
- Napisać `Container` (maksymalna szerokość), `Stack` (odstępy w pionie i poziomie przez prop `gap`), `Panel` (ramka z nagłówkiem, `tone`), `Sidebar` i `Toolbar`.

**Kiedy jest gotowe**
- [ ] Strony da się złożyć z tych komponentów bez pisania własnego CSS do układu.
- [ ] `Panel` wygląda poprawnie w 3 motywach.

**Zależy od:** F-09

### F-19 [F][mvp] Toast do komunikatów i błędów
**Co trzeba zrobić**
- Napisać `ToastProvider` i funkcję `toast.success/error/info(messageKey)`.
- Toast znika po kilku sekundach i można go zamknąć ręcznie.

**Kiedy jest gotowe**
- [ ] `toast.error('errors.layerLimit')` pokazuje przetłumaczony tekst.
- [ ] Kilka toastów układa się jeden pod drugim, a nie na sobie.
- [ ] Czytnik ekranu ogłasza treść toastu (`role="status"`).

**Zależy od:** F-12, F-15

### F-20 [F][mvp] Strona /dev/ui z katalogiem komponentów
**Co trzeba zrobić**
- Utworzyć stronę, która pokazuje każdy komponent z `shared/` we wszystkich wariantach.
- Na górze strony dać przełącznik motywu i języka.

**Kiedy jest gotowe**
- [ ] Każdy komponent z `shared/components` jest na tej stronie.
- [ ] Reviewer może sprawdzić nowy komponent bez szukania go w aplikacji.

**Zależy od:** F-15 … F-19

---

## Etap 3: Szkielet aplikacji

### F-21 [F][mvp] Routing, AppLayout i puste podstrony
**Co trzeba zrobić**
- Skonfigurować React Router z trasami `/`, `/character`, `/map`, `/projects`, `/dev/ui` i stroną 404.
- Utworzyć `AppLayout`: górna nawigacja z linkami i miejsce na treść.
- Każda podstrona to na razie tytuł w `Container`.

**Kiedy jest gotowe**
- [ ] Da się przejść po wszystkich stronach z nawigacji.
- [ ] Aktywny link jest wyróżniony.
- [ ] Nieznany adres pokazuje stronę 404 z linkiem do strony głównej.

**Zależy od:** F-18

### F-22 [F][mvp] Przełączniki motywu i języka w nawigacji
**Co trzeba zrobić**
- W `features/settings/` utworzyć `ThemeSwitcher` (3 opcje) i `LanguageSwitcher` (flagi PL i EN).
- Wstawić je do `AppLayout`.

**Kiedy jest gotowe**
- [ ] Zmiana działa na każdej podstronie i zostaje po odświeżeniu.
- [ ] Oba przełączniki działają z klawiatury i mają etykiety dla czytnika ekranu.

**Zależy od:** F-11, F-12, F-21

### F-23 [F][mvp] apiClient i obsługa błędów API
**Co trzeba zrobić**
- Utworzyć `shared/lib/apiClient.ts`: funkcje `get`, `post`, `put` i `del` na `fetch`, adres z `config/env.ts`.
- Mapować błędy na format z rozdziału 5.6 (`messageKey`) i obsłużyć brak połączenia (`errors.network`).
- Dodać mały wskaźnik w stopce, który odpytuje `/api/health`.
- Uzgodnić z Frankiem dokładny format błędu.

**Kiedy jest gotowe**
- [ ] Po wyłączonym backendzie użytkownik widzi przetłumaczony komunikat, a nie biały ekran.
- [ ] Jest test: odpowiedź z błędem 400 zwraca `messageKey` z backendu.
- [ ] Franek zaakceptował format błędu.

**Zależy od:** F-06, F-19. Uzgodnione z: Franek.

### F-24 [F][mvp] Zaślepka silnika (mock createEditor)
**Co trzeba zrobić**
- W `features/map-editor/engine/` utworzyć tymczasowy `createEditor`, który ma to samo API co silnik Kuby (rozdział 6.3): `getScene`, `subscribe`, `execute`, `canPlace`, `undo`, `redo`, `snapToGrid`.
- Kolizja w zaślepce może być uproszczona (zwykłe prostokąty bez obrotu).
- Typy brać z `@worldsmith/engine`, jeśli już są, a jeśli nie, z kopii typów z rozdziału 5.
- Cały frontend importuje silnik z jednego pliku `engine/index.ts`.

**Kiedy jest gotowe**
- [ ] Frontend działa bez prawdziwego silnika.
- [ ] Podmiana na prawdziwy silnik to zmiana jednego importu w `engine/index.ts`.
- [ ] Kuba potwierdził, że API zaślepki zgadza się z jego planem.

**Zależy od:** F-01. Uzgodnione z: Kuba.

### F-25 [F][mvp] Store edytora (Zustand)
**Co trzeba zrobić**
- Utworzyć `features/map-editor/store/` ze store'em Zustand, który trzyma instancję `editor`, scenę (odświeżaną przez `subscribe`), zaznaczenie, aktywne narzędzie, aktywną warstwę, zoom i pozycję widoku.
- Komponenty nie wołają silnika bezpośrednio, tylko przez akcje store'u.

**Kiedy jest gotowe**
- [ ] Wywołanie `editor.execute(...)` od razu odświeża komponenty, które używają sceny.
- [ ] Jest test: dodanie obiektu przez akcję store'u zmienia scenę.

**Zależy od:** F-24

---

## Etap 4: Canvas

### F-26 [F][mvp] SceneRenderer: rysowanie sceny
**Co trzeba zrobić**
- W `shared/canvas/` utworzyć `SceneRenderer`: `Stage` → `Layer` na każdą warstwę → `Image` na każdy obiekt (pozycja, obrót, skala z danych).
- Dodać hook `useAssetImage(url)` z cache, żeby ten sam PNG ładował się raz.
- Pomijać ukryte warstwy.
- Komponent jest wspólny dla edytora map i kreatora postaci.

**Kiedy jest gotowe**
- [ ] Przykładowa scena z JSON-a rysuje się poprawnie, a wyższa warstwa zasłania niższą.
- [ ] Obrót i skala obiektu na ekranie zgadzają się z danymi.
- [ ] Scena z około 200 obiektami nie przycina się przy przewijaniu.

**Zależy od:** F-25

### F-27 [F][mvp] Siatka 32 px i przyciąganie
**Co trzeba zrobić**
- Utworzyć `GridLayer`: linie co 32 px rysowane w jednej warstwie Konvy (bez nasłuchiwania zdarzeń).
- Dodać przełączniki „pokaż siatkę” i „przyciągaj do siatki” w store i w pasku narzędzi.

**Kiedy jest gotowe**
- [ ] Siatka pokrywa całą mapę i skaluje się z zoomem.
- [ ] Przy włączonym przyciąganiu obiekty lądują na punktach siatki (`snapToGrid`).
- [ ] Na dużej mapie (64×48) siatka nie spowalnia przeciągania.

**Zależy od:** F-26

### F-28 [F][mvp] Zoom i przesuwanie widoku
**Co trzeba zrobić**
- Zoom kółkiem myszy w miejscu kursora, a także klawiszami `+` i `−`, w zakresie od 25% do 400%.
- Przesuwanie widoku spacją z przeciąganiem albo środkowym przyciskiem myszy.
- Dodać przycisk „dopasuj do ekranu” i wskaźnik procentu zoomu.

**Kiedy jest gotowe**
- [ ] Punkt pod kursorem zostaje w miejscu przy zoomie.
- [ ] Widoku nie da się „zgubić” daleko od mapy.
- [ ] Zoom i pozycja są w store (inne komponenty mogą je czytać).

**Zależy od:** F-26

---

## Etap 5: Edytor map

### F-29 [F][mvp] Układ strony edytora map
**Co trzeba zrobić**
- Złożyć stronę `/map` z gotowych komponentów: `Toolbar` u góry, paleta assetów po lewej, canvas na środku, panele warstw i właściwości po prawej.
- Na razie wstawić puste panele z tytułami.

**Kiedy jest gotowe**
- [ ] Układ działa od 1280 px szerokości bez poziomego paska przewijania.
- [ ] Canvas zajmuje całe wolne miejsce i dopasowuje się do zmiany rozmiaru okna.
- [ ] Plik strony tylko składa komponenty i nie ma własnego CSS.

**Zależy od:** F-18, F-26

### F-30 [F][mvp] Okno „Nowa mapa”
**Co trzeba zrobić**
- Dodać `Modal` z wyborem rozmiaru (mała 20×15, średnia 40×30, duża 64×48), nazwą mapy i przyciskiem „Utwórz”.
- Okno otwiera się przy wejściu na `/map` bez wybranego projektu i z przycisku w pasku narzędzi.

**Kiedy jest gotowe**
- [ ] Powstaje pusta scena o wybranym rozmiarze z jedną warstwą.
- [ ] Pusta nazwa blokuje przycisk „Utwórz” i pokazuje komunikat.

**Zależy od:** F-17, F-29

### F-31 [F][mvp] Paleta assetów i dodawanie obiektów
**Co trzeba zrobić**
- Pobierać listę z `GET /api/assets?module=map` (do czasu gotowego backendu: z `assets/manifest.json`).
- Pokazać zakładki kategorii i siatkę miniatur z nazwą w tooltipie.
- Kliknięcie dodaje obiekt na środek widoku. Przeciągnięcie na canvas dodaje go w miejscu upuszczenia.
- Obiekt trafia na aktywną warstwę, przez `editor.execute(addObject(...))`.

**Kiedy jest gotowe**
- [ ] Wszystkie assety mapy z manifestu są widoczne w palecie.
- [ ] Dodanie w miejscu kolizji jest blokowane i pokazuje toast.
- [ ] Ctrl+Z cofa dodanie obiektu.

**Zależy od:** F-23, F-25, F-29. Uzgodnione z: Franek, Monika.

### F-32 [F][mvp] Zaznaczanie obiektów
**Co trzeba zrobić**
- Kliknięcie zaznacza jeden obiekt, Shift+klik dodaje lub odejmuje z zaznaczenia, a kliknięcie w puste miejsce czyści zaznaczenie.
- Przeciągnięcie po pustym miejscu rysuje prostokąt zaznaczenia (`editor.objectsInRect`).
- Zaznaczać tylko obiekty z widocznych warstw.

**Kiedy jest gotowe**
- [ ] Zaznaczone obiekty mają wyraźną ramkę.
- [ ] Zaznaczenie jest w store i widzą je panele.
- [ ] Esc czyści zaznaczenie.

**Zależy od:** F-26

### F-33 [F][mvp] Przeciąganie obiektów z kolizją i współrzędnymi
**Co trzeba zrobić**
- Podczas `onDragMove` wołać `editor.canPlace(...)`. Przy kolizji dać czerwony obrys przeciąganego obiektu i podświetlić te, z którymi koliduje.
- Obok kursora pokazywać etykietę z (x, y) w pikselach.
- Na `onDragEnd`:
  - jeśli wolno, wywołać `execute(transformObjects(...))`;
  - jeśli nie, obiekt wraca na starą pozycję z animacją `shake` i pokazuje się toast.
- Przeciąganie kilku zaznaczonych obiektów naraz.
- Strzałki przesuwają o 1 px, a Shift ze strzałką o 32 px.
- Po gotowym silniku Kuby przetestować z prawdziwym SAT.

**Kiedy jest gotowe**
- [ ] Nie da się upuścić obiektu na kolidujące miejsce na tej samej warstwie.
- [ ] Na różnych warstwach obiekty mogą na siebie nachodzić.
- [ ] Współrzędne na etykiecie zgadzają się z panelem właściwości.
- [ ] Ctrl+Z cofa przesunięcie.

**Zależy od:** F-27, F-32. Uzgodnione z: Kuba.

### F-34 [F][mvp] Obracanie i skalowanie (Transformer)
**Co trzeba zrobić**
- Dodać `SelectionTransformer` (Konva `Transformer`) na zaznaczonych obiektach.
- Obrót z Shift skacze co 15°. Skalowanie z Shift zachowuje proporcje.
- Przy kolizji po obrocie lub skalowaniu dać czerwony obrys, a po puszczeniu przywrócić poprzedni stan.

**Kiedy jest gotowe**
- [ ] Obrót i skala zapisują się w scenie przez `execute`.
- [ ] Kolizja blokuje zmianę tak samo jak przy przeciąganiu.
- [ ] Ctrl+Z cofa obrót i skalowanie.

**Zależy od:** F-33

### F-35 [F][mvp] Panel warstw
**Co trzeba zrobić**
- Pokazać listę warstw od najwyższej do najniższej, z wyróżnioną aktywną warstwą.
- Akcje: dodaj, usuń (z potwierdzeniem, jeśli warstwa ma obiekty), zmień nazwę, przesuń w górę i w dół, ukryj i pokaż.
- Limit 10 warstw: przycisk „Dodaj” jest wyłączony z tooltipem `errors.layerLimit`.

**Kiedy jest gotowe**
- [ ] Zmiana kolejności od razu zmienia, co jest „na wierzchu” na canvasie.
- [ ] 11. warstwy nie da się dodać.
- [ ] Każdą akcję da się cofnąć Ctrl+Z.

**Zależy od:** F-25, F-29

### F-36 [F][mvp] Panel właściwości obiektu
**Co trzeba zrobić**
- Dla jednego zaznaczonego obiektu pokazać pola x, y, obrót i skala X/Y oraz nazwę assetu i warstwę.
- Zmiana wartości przechodzi przez `canPlace`, a przy kolizji pole pokazuje błąd i wartość wraca.
- Przy kilku zaznaczonych obiektach pokazać tylko ich liczbę i przycisk „Usuń”.

**Kiedy jest gotowe**
- [ ] Wpisanie wartości i Enter przesuwa lub obraca obiekt na canvasie.
- [ ] Przeciąganie na canvasie na bieżąco aktualizuje pola.

**Zależy od:** F-16, F-32

### F-37 [F][mvp] Skróty klawiszowe oraz cofnij i ponów
**Co trzeba zrobić**
- Utworzyć `config/hotkeys.ts` z listą skrótów z 7.5 (strzałki, Shift, Delete, Ctrl+Z/Y/S, R, +/−) i hook `shared/hooks/useHotkeys`.
- Dodać przyciski „Cofnij” i „Ponów” w pasku narzędzi, wyłączone, gdy nie ma czego cofać.
- Skróty nie działają, gdy kursor jest w polu tekstowym.
- Dodać okno „Skróty klawiszowe” (pod `?`) z listą z `hotkeys.ts`.

**Kiedy jest gotowe**
- [ ] Wszystkie skróty z listy działają w edytorze.
- [ ] Wpisywanie tekstu w polu nie odpala skrótów.
- [ ] Zmiana skrótu wymaga edycji tylko `hotkeys.ts`.

**Zależy od:** F-33, F-35

---

## Etap 6: Projekty

### F-38 [F][mvp] Zapis i wczytywanie projektu
**Co trzeba zrobić**
- Ctrl+S i przycisk „Zapisz”:
  - pierwszy zapis to `POST /api/projects`;
  - kolejne to `PUT /api/projects/{id}`.
- Wejście na `/map/:id` wczytuje projekt przez `GET` i tworzy edytor z tej sceny.
- Dodać znacznik „niezapisane zmiany” i ostrzeżenie przy wyjściu ze strony.
- Błędy walidacji z backendu pokazywać w toaście.

**Kiedy jest gotowe**
- [ ] Po zapisie i odświeżeniu strony widać dokładnie ten sam stan sceny.
- [ ] Zamknięcie karty z niezapisanymi zmianami pyta o potwierdzenie.

**Zależy od:** F-23, F-25. Uzgodnione z: Franek.

### F-39 [F][mvp] Strona listy projektów
**Co trzeba zrobić**
- Na `/projects` pokazać listę z `GET /api/projects` z nazwą, typem (mapa lub postać) i datą zmiany.
- Dodać filtr „Mapy / Postacie”.
- Akcje: otwórz, usuń (z potwierdzeniem w `Modal`).
- Pusta lista pokazuje komunikat i przycisk „Nowa mapa”.

**Kiedy jest gotowe**
- [ ] Otwarcie projektu przenosi do właściwego edytora.
- [ ] Usunięty projekt znika z listy bez przeładowania strony.

**Zależy od:** F-21, F-38

### F-40 [F][mvp] Import i eksport pliku .worldsmith.json
**Co trzeba zrobić**
- Przycisk „Eksportuj JSON” pobiera plik z `GET /api/projects/{id}/export`.
- Przycisk „Importuj” na stronie projektów wysyła plik na `POST /api/projects/import` i otwiera nowy projekt.

**Kiedy jest gotowe**
- [ ] Eksport, a potem import tego samego pliku daje identyczną scenę.
- [ ] Błędny plik daje przetłumaczony komunikat, a nie biały ekran.

**Zależy od:** F-38, F-39

### F-41 [F][mvp] Eksport mapy do PNG
**Co trzeba zrobić**
- Dodać przycisk „Eksportuj PNG”, który używa `stage.toDataURL` z rozmiarem całej mapy.
- Przed eksportem ukryć siatkę i zaznaczenie, a po eksporcie je przywrócić.

**Kiedy jest gotowe**
- [ ] PNG ma pełny rozmiar mapy (np. 1280×960 dla średniej) niezależnie od zoomu.
- [ ] Na PNG nie ma siatki ani ramek zaznaczenia.
- [ ] Tło jest przezroczyste.

**Zależy od:** F-26

---

## Etap 7: Kreator postaci

### F-42 [F][mvp] Strona kreatora postaci i wybór bazy
**Co trzeba zrobić**
- Złożyć stronę `/character`: canvas z `SceneRenderer` na środku i panel wyboru po lewej.
- Wybór bazy: kobieta lub mężczyzna, assety z `module=character`.
- Postać to scena ze stałymi warstwami: baza, spodnie, koszulka, włosy (rozdział 5.3).
- Uzgodnić z Moniką kolejność warstw i rozmiar płótna.

**Kiedy jest gotowe**
- [ ] Wybrana baza wyświetla się na środku canvasu w pełnej rozdzielczości.
- [ ] Zmiana bazy podmienia ją bez przeładowania strony.

**Zależy od:** F-26, F-31. Uzgodnione z: Monika.

### F-43 [F][mvp] Sloty ubrań w kreatorze
**Co trzeba zrobić**
- Dla każdego slotu (włosy, koszulka, spodnie) pokazać listę miniatur i opcję „brak”.
- Wybranie elementu podmienia obiekt na stałej warstwie slotu.
- Działają cofnij i ponów.

**Kiedy jest gotowe**
- [ ] Da się ubrać postać w każdą kombinację z dostępnych assetów.
- [ ] Ubrania zawsze leżą w dobrej kolejności (włosy nad koszulką itd.).
- [ ] Ctrl+Z cofa zmianę ubrania.

**Zależy od:** F-42

### F-44 [F][mvp] Zapis postaci jako projekt
**Co trzeba zrobić**
- Wykorzystać zapis z F-38 dla projektu typu `character`.
- Dodać eksport postaci do PNG (z F-41).

**Kiedy jest gotowe**
- [ ] Zapisana postać jest na liście projektów z filtrem „Postacie” i otwiera się w kreatorze.
- [ ] PNG postaci ma przezroczyste tło.

**Zależy od:** F-38, F-41, F-43

---

## Etap 8: Domknięcie

### F-45 [F][mvp] Dokumentacja frontendu (docs/frontend)
**Co trzeba zrobić**
- Napisać 5 plików z rozdziału 7.6: `ARCHITECTURE.md`, `SHARED_COMPONENTS.md`, `I18N.md`, `THEMING.md` i `INTEGRATIONS.md`.
- W `THEMING.md` opisać CSS Modules i tokeny, czyli jak zmienić kolor albo dodać wariant.

**Kiedy jest gotowe**
- [ ] Ktoś z zespołu, kto nie pisał frontendu, umie dodać tłumaczenie i zmienić kolor przycisku tylko na podstawie docs.
- [ ] Każdy komponent z `shared/` jest opisany (propsy i warianty).

**Zależy od:** większość tasków powyżej

### F-46 [F][mvp] Przegląd dostępności
**Co trzeba zrobić**
- Przejść główną ścieżkę (nowa mapa → dodanie obiektów → zapis) samą klawiaturą.
- Sprawdzić widoczny fokus i kontrast w 3 motywach (Lighthouse albo DevTools).
- Poprawić znalezione problemy.

**Kiedy jest gotowe**
- [ ] Główną ścieżkę da się przejść bez myszy, poza samym przeciąganiem na canvasie, które zastępują strzałki.
- [ ] Lighthouse daje co najmniej 90 punktów w kategorii Accessibility na stronach poza canvasem.

**Zależy od:** F-37

### F-47 [F][mvp] Test scenariusza prezentacji i poprawki
**Co trzeba zrobić**
- Razem z Moniką spisać scenariusz prezentacji prototypu (co klikamy i w jakiej kolejności).
- Przejść go na czystej bazie i poprawić błędy, które wyjdą (każdy większy błąd to osobny issue `fix`).

**Kiedy jest gotowe**
- [ ] Scenariusz przechodzi 3 razy pod rząd bez błędu.
- [ ] Zgłoszone błędy są naprawione albo świadomie przesunięte na `final`.

**Zależy od:** wszystkie taski powyżej. Uzgodnione z: Monika.
