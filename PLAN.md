# Plan dalszej implementacji Bomb-It (dla podagentów)

Dokument dla orkiestratora i podagentów. Każde zadanie ma: zakres, pliki, które wolno ruszać,
kryteria akceptacji i zależności. Zadania w tym samym etapie mogą iść równolegle **tylko** jeśli
dotykają rozłącznych plików (wypisanych przy zadaniu).

---

## 0. Zasady wspólne dla wszystkich podagentów

- **Next.js 16.3 + React 19.2 + React Compiler.** Przed pisaniem kodu przeczytaj odpowiedni
  fragment `node_modules/next/dist/docs/` (zgodnie z `AGENTS.md`). Nie zakładaj API ze starszych wersji.
- Język: JavaScript (bez TypeScriptu), komponenty klienckie z `"use client"`.
- Trzymaj się istniejącego stylu: czysta logika w plikach bez Reacta (`bomb.js`, `bot.js`,
  `maze.js`, `playerMovement.js`), React w hookach `use*.js` i komponentach. Komentarze po polsku,
  oszczędnie.
- Stan współdzielony z timerami/intervalami trzymamy przez `useLatest` + ref (obecny wzorzec).
- Wszystkie liczby do strojenia (czasy, szanse, mnożniki) trafiają do `src/app/config.js`
  (tworzony w Etapie 0), nie są rozsiane po plikach.
- Nowe style: **osobny plik CSS module na komponent** (np. `EndScreen.module.css`), żeby równoległe
  zadania nie konfliktowały w `page.module.css`.
- Weryfikacja po każdym zadaniu: `npm run lint` bez błędów, `npm run build` przechodzi, ręczny test
  w przeglądarce (`npm run dev`, http://localhost:3000).
- Każde zadanie kończy się osobnym commitem z opisem po polsku.
- Projekt nie ma testów automatycznych; czystą logikę pisz tak, żeby dało się ją testować
  (funkcje bez efektów ubocznych, wejście → wyjście).

### Decyzje projektowe (ustalone z użytkownikiem)

| Temat | Decyzja |
|---|---|
| Granat | Ten sam klawisz co bomba (Spacja). Rzut w kierunku patrzenia na stałą odległość (2 pola), przelatuje nad ścianą. Jednorazowy. |
| Bonusy | Każdy działa 10 s. Różne mogą działać naraz, ten sam odświeża czas. |
| Bonus negatywny | Wygląda tak samo jak pozytywny („pytajnik”), efekt ujawnia się po zebraniu. |
| Boty | 3 boty, każdy na każdego (bomby ranią wszystkich). Boty zbierają bonusy tylko przypadkiem. Wygrana gracza = wszystkie boty martwe. |
| Grafiki | Generowane przez AI jako PNG w stylu sprite'a gracza (`public/player/*.png`). |
| Animacja kroku | Postacie mają animowany krok: klatki chodu generowane przez AI dla każdego kierunku. Boty używają tych samych klatek (przebarwionych). |
| Muzyka | „Pszczółka Maja” Zenona Martyniuka. Plik dostarcza użytkownik: `public/audio/background.mp3`. Domyślnie wyciszona. |
| Ekran końcowy | Wynik + statystyki + „Zagraj ponownie” (przycisk i Enter). Restart losuje nowy labirynt. |

---

## Kolejność i równoległość

```
Etap 0 (sekwencyjnie, 1 agent)   T0: Refaktor modelu gry
                                        │
Etap 1 (równolegle, 4 agentów)   T1: Ściany   T3: Boty   T4a: Grafiki   T5: Muzyka
                                        │         │
Etap 2 (równolegle, 2 agentów)   T2a: Bonusy (system efektów) → T2b: Granat   T8: Animacja kroku
                                        │
Etap 3 (równolegle, 2 agentów)   T6: Ekran końcowy + statystyki   T4b: Podpięcie grafik
                                        │
Etap 4 (1 agent)                 T7: Przegląd końcowy, strojenie balansu
```

Dlaczego tak:
- **T0 najpierw**: gracz i bot są dziś osobnymi zmiennymi (`playerLives`, `botLives`,
  `botPosition`…). Każde kolejne zadanie musiałoby to przerabiać, więc robi to jeden agent przed
  pracą równoległą.
- **T2 po T1 i T3**: bonusy wypadają ze ścian (T1) i zbierają je boty (T3).
- **T4a (generowanie) wcześnie, T4b (podpinanie) na końcu**: generowanie nie dotyka kodu, a
  podpinanie po T1/T2/T3 obejmie od razu wszystkie nowe obiekty.
- **T5 jest niezależne** i dotyka tylko `page.js` i nowych plików.
- **T6 po T2**: statystyki liczą zebrane bonusy i zniszczone ściany.
- **T8 w Etapie 2**: potrzebuje klatek chodu z T4a, komponentu `ActorSprite` z T0 i
  przebarwień botów z T3. Dotyka tylko `ActorSprite.*` i `assets.js`, więc nie koliduje z T2a/T2b.

**Przed Etapem 0:** w repo są niezacommitowane zmiany (sprite'y gracza, kierunek patrzenia).
Orkiestrator najpierw robi commit obecnego stanu, żeby agenci startowali z czystego drzewa.

---

## Etap 0

### T0. Refaktor modelu gry (fundament)

**Cel:** jeden spójny model postaci, ścian i pętli gry, gotowy pod N botów, efekty i typy ścian.
Zachowanie gry po refaktorze ma być takie samo jak teraz (1 gracz, 1 bot).

**Zakres:**
1. `src/app/config.js`: przenieś tu stałe (`BOMB_TIMER_MS`, `BOMB_RANGE`,
   `EXPLOSION_DURATION_MS`, `STARTING_LIVES`, `BOT_MOVE_INTERVAL_MS`, `PLAYER_MOVE_INTERVAL_MS`,
   `BOARD_SIZE`, `ARENA_SIZE`) oraz `BOT_COUNT = 1` (T3 zmieni na 3).
2. **Model postaci (`actors`)**: jedna tablica w stanie zamiast osobnych zmiennych gracza i bota:
   ```js
   {
     id: "player" | "bot-1" | "bot-2" | "bot-3",
     kind: "player" | "bot",
     color: "blue" | "red" | "green" | "purple",
     position: { row, col },
     facing: "up" | "down" | "left" | "right",
     lives: number,
     alive: boolean,
     effects: {},          // T2a: { speed: { until: timestamp }, ... }
     nextMoveAt: number,   // znacznik czasu, od którego postać może zrobić kolejny krok
   }
   ```
   Pomocnicze czyste funkcje w nowym `src/app/actors.js`: `createActor`, `updateActor(actors, id, patch)`,
   `getActor`, `aliveActors`, `moveIntervalFor(actor, now)` (na razie zwraca stałą bazową;
   T2a doda mnożniki).
3. **Model ścian**: zamiast tablicy `{x, y}` w pikselach przechowuj komórki
   `{ row, col, type }`, gdzie `type` to na razie zawsze `"destructible"`. Piksele licz tylko przy
   renderowaniu (`cellToPixels`). Dostosuj `renderWall`, `checkCollision`, `removeDestroyedWalls`,
   `getExplosionCells`, `pickEmptyPosition`. Dla wydajności można trzymać dodatkowo `Map` po kluczu
   `"row,col"`, ale nie jest to wymagane.
4. **Wybuchy dla N postaci**: `resolveExplosionOutcome` przyjmuje `actors` i zwraca nową tablicę
   `actors` (odjęte życia, `alive=false` przy 0) oraz listę zniszczonych ścian (`destroyedWalls`,
   przyda się T2a i T6). Bomba ma `owner` = id postaci. Martwe postacie znikają z planszy, ale ich
   bomby wybuchają normalnie.
5. **Status gry** liczony jedną funkcją `computeGameStatus(actors)`: `"lose"` gdy gracz martwy, a
   żyje jakiś bot; `"win"` gdy gracz żyje i wszystkie boty martwe; `"draw"` gdy wszyscy martwi
   naraz; inaczej `"playing"`. Gra kończy się od razu po śmierci gracza.
6. **Pętla gry**: zamień `setInterval` bota w `useBotMovement` na wspólny tick (np. co 50 ms,
   nowy hook `useGameLoop`), w którym każdy żywy bot rusza się, gdy `now >= nextMoveAt`. Gracz dalej
   steruje klawiaturą, ale jego tempo też wynika z `nextMoveAt` i `moveIntervalFor`. Dzięki temu
   bonusy szybkości/spowolnienia w T2a sprowadzą się do zmiany `moveIntervalFor`.
7. `Player.js` → uogólnij do `ActorSprite` (lub zostaw nazwę), który przyjmuje `actor` i
   ustawia czas przejścia CSS na interwał ruchu tej postaci (dziś jest zawsze `BOT_MOVE_INTERVAL_MS`).
   Bot dostaje `facing` liczone z kierunku ruchu (`facingFromDirection`).
8. `page.js`: usuń „Hello World”, dodaj komponent `GameSession`, który renderuje
   `<GameBoard key={sessionId} onRestart={...} />`. T6 użyje tego do restartu.
   `layout.js`: tytuł „Bomb-It”, `lang="pl"`.
9. Usuń nieużywane pliki/style po weryfikacji (`collision.js` jeśli nieużywany, style `.table`,
   `.main`, `.intro`, `.ctas` z szablonu Next). Stary `src/app/plan.md` zastąp linkiem do tego pliku.

**Pliki:** praktycznie wszystkie w `src/app/` (dlatego etap jest sekwencyjny).

**Akceptacja:**
- Gra działa jak przed zmianą: gracz chodzi, stawia bomby, bot chodzi i ucieka, życia spadają,
  komunikat końca gry działa.
- W kodzie nie ma już `playerLives`/`botLives`/`botPosition` jako osobnych stanów.
- Zmiana `BOT_COUNT` na 2 w `config.js` daje 2 działające boty (nawet bez kolorów).

---

## Etap 1 (równolegle)

### T1. Rodzaje ścian

**Cel:** trzy typy ścian.

| `type` | Niszczalna | Co daje | Wygląd |
|---|---|---|---|
| `solid` | nie | nic, zatrzymuje wybuch | osobna grafika (kamień/metal) |
| `destructible` | tak | nic | skrzynka/cegła |
| `bonus` | tak | po zniszczeniu wypada bonus | **identyczna jak `destructible`** (nie zdradzamy, gdzie jest bonus) |

**Zakres:**
1. Generowanie w `maze.js` (`generateMaze`):
   - Obecny algorytm DFS drąży korytarze po polach o nieparzystych współrzędnych, więc pola, gdzie
     **wiersz i kolumna są parzyste**, nigdy nie są drążone. To naturalne „filary”: oznacz je
     `solid`. Labirynt pozostaje spójny, bo korytarze nie zależą od ścian.
   - Pozostałe ściany: losowo `bonus` z prawdopodobieństwem `BONUS_WALL_CHANCE` (domyślnie 0.4),
     reszta `destructible`.
   - Opcjonalnie: dodatkowa garść losowych `solid` wśród pozostałych (`EXTRA_SOLID_CHANCE`,
     domyślnie 0). Uwaga: nie wolno wtedy zablokować jedynego przejścia; najprościej zostawić 0.
2. `bomb.js`: wybuch zatrzymuje się na `solid` **bez** wchodzenia na to pole (jak obramowanie).
   Na `destructible`/`bonus` wchodzi, niszczy i zatrzymuje się. `removeDestroyedWalls` nigdy nie
   usuwa `solid`.
3. `resolveExplosionOutcome` zwraca w `destroyedWalls` pełne obiekty z `type`, żeby T2a mógł zrobić
   `type === "bonus"` → spawn bonusu. W T1 wystarczy, że ta informacja jest zwracana.
4. `WallBlock.js`: renderuje wg `type` (na razie kolory CSS: `solid` szary, pozostałe brązowe;
   grafiki podepnie T4b). Obramowanie mapy też traktuj jak `solid` wizualnie.
5. Bot (`bot.js`): `canEscapeBlast` i ruch muszą uwzględniać, że `solid` blokuje wybuch inaczej
   (sprawdź, że bot nie wpada we własny wybuch).

**Pliki:** `maze.js`, `bomb.js` (tylko logika ścian i wybuchu), `WallBlock.js`, `config.js` (nowe
stałe), ewentualnie `bot.js` (tylko funkcje bezpieczeństwa). **Nie ruszać:** spawnu postaci,
`useGameLoop`, `Hud.js`.

**Akceptacja:** widać dwa rodzaje wyglądu ścian; filarów nie da się zniszczyć; wybuch nie
przechodzi przez filar; ściany `bonus` są nieodróżnialne od `destructible`.

---

### T3. Trzech botów w różnych kolorach

**Cel:** gracz + 3 boty, każdy na każdego.

**Zakres:**
1. `config.js`: `BOT_COUNT = 3`. Kolory: gracz niebieski (obecny sprite), boty: czerwony,
   zielony, fioletowy.
2. **Spawn**: gracz i boty startują jak najdalej od siebie, najlepiej w okolicach czterech
   rogów planszy (pola korytarza najbliższe rogom). Funkcja `pickSpawnPositions(walls, borders, count)`
   w `actors.js` lub `useOpeningLayout.js`. Pole startowe i sąsiednie muszą być wolne (generator
   drąży od pozycji gracza, więc dla botów wybierz najbliższe wolne pole korytarza przy rogu).
3. **Kolory botów**: na razie sprite gracza z filtrem CSS (`hue-rotate`) per kolor, np. klasy
   `.tintRed`, `.tintGreen`, `.tintPurple` w nowym `ActorSprite.module.css`. T4b może zamienić je na
   osobne sprite'y, jeśli filtr źle wygląda.
4. **AI**: każdy bot ma własny stan kierunku (dziś jest jedna zmienna `direction` w closure hooka).
   Boty unikają wszystkich bomb (nie tylko swoich), traktują inne postacie jak przechodnie pola (nie
   blokują się nawzajem; można stać na tym samym polu). Każdy bot ma limit 1 własnej bomby.
5. **Bomby ranią wszystkich**, łącznie z właścicielem (już tak jest, sprawdź dla N botów).
6. `Hud.js`: lista wszystkich postaci z kolorową kropką, nazwą („Ty”, „Czerwony”, „Zielony”,
   „Fioletowy”) i liczbą żyć; martwe przekreślone.
7. Komunikaty końca w `gameOver.js` dopasuj do wielu botów (ostateczny ekran robi T6).

**Pliki:** `config.js` (`BOT_COUNT`, kolory), `useOpeningLayout.js`, `useGameLoop.js` (część botów),
`bot.js` (AI), `ActorSprite.js` + nowy CSS module, `Hud.js`, `gameOver.js`. **Nie ruszać:**
`maze.js`, `WallBlock.js`, logiki niszczenia ścian w `bomb.js` (to T1).

**Konflikty z T1:** oba mogą dotknąć `bot.js` i `config.js`. T1 zmienia tylko funkcje
bezpieczeństwa wybuchu, T3 logikę wyboru ruchu. Orkiestrator merguje T1 przed T3 albo rozwiązuje
konflikt ręcznie.

**Akceptacja:** na starcie 4 postacie w czterech rejonach mapy, boty w 3 kolorach, każdy stawia
bomby i ucieka; bot może zginąć od bomby innego bota; po śmierci wszystkich botów jest wygrana.

---

### T4a. Generowanie grafik (bez zmian w kodzie)

**Cel:** komplet assetów w `public/`, spójnych stylistycznie z `public/player/down.png`
(cartoon/kawaii, błyszczący, gruby ciemny kontur, przezroczyste tło).

**Wymagania techniczne:** PNG, kwadrat (minimum 256×256), **przezroczyste tło** dla obiektów
(sprawdź po wygenerowaniu; jeśli generator dał tło, usuń je), kafelki ścian/podłogi bez
przezroczystości i bezszwowe.

**Lista assetów:**

| Plik | Opis |
|---|---|
| `public/walls/solid.png` | niezniszczalny blok (kamień/metal z nitami), wyraźnie inny niż skrzynka |
| `public/walls/destructible.png` | drewniana skrzynka/cegły (używana dla `destructible` i `bonus`) |
| `public/walls/border.png` | ciemniejszy wariant `solid` na obramowanie mapy |
| `public/floor.png` | subtelny kafelek podłogi (opcjonalny, ciemny, pasujący do `#0c2a33`) |
| `public/objects/bomb.png` | klasyczna czarna bomba z lontem |
| `public/objects/grenade.png` | granat (inny kształt niż bomba, np. zielony ananas) |
| `public/objects/explosion.png` | płomień/wybuch na jedno pole |
| `public/bonuses/mystery.png` | wspólna ikona bonusu na mapie: świecący pytajnik/prezent |
| `public/bonuses/immunity.png` | ikona HUD: tarcza |
| `public/bonuses/speed.png` | ikona HUD: błyskawica/but |
| `public/bonuses/range.png` | ikona HUD: płomień ze strzałkami |
| `public/bonuses/grenade.png` | ikona HUD: granat (może być `objects/grenade.png`) |
| `public/bonuses/slow.png` | ikona HUD: ślimak |
| `public/bonuses/fragile.png` | ikona HUD: pęknięte serce (podwójne obrażenia) |
| `public/ui/end-background.png` | tło ekranu końcowego (np. zgliszcza areny, 16:9, może być nieprzezroczyste) |
| `public/ui/sound-on.png`, `public/ui/sound-off.png` | ikony przycisku muzyki (mogą być też SVG) |
| `public/bots/{red,green,purple}/{up,down,left,right}.png` | **opcjonalnie**, tylko jeśli filtr `hue-rotate` z T3 wygląda źle; ten sam robot w innych kolorach, 4 kierunki jak u gracza. Uwaga: wtedy klatki chodu (niżej) też trzeba by robić osobno dla każdego koloru, czyli 3× więcej obrazków |

**Klatki chodu gracza (dla T8), wymagane:**

| Plik | Opis |
|---|---|
| `public/player/walk/{dir}-1.png` | krok lewą nogą: lewa noga wysunięta, przeciwna ręka do przodu |
| `public/player/walk/{dir}-2.png` | krok prawą nogą: lustrzana faza do `-1` |

gdzie `{dir}` = `up`, `down`, `left`, `right`, czyli razem 8 obrazków. Obecne
`public/player/{dir}.png` zostają jako klatka stania (idle) i środkowa faza kroku.

Wymagania spójności klatek (najważniejsze w całym T4a):
- Generuj z **obrazem referencyjnym**: przekaż odpowiedni `public/player/{dir}.png` w
  `reference_image_paths`. W opisie poproś o tę samą postać, tę samą skalę, ten sam kadr i to
  samo położenie na płótnie, a zmieniać się mają tylko nogi i ręce.
- Płótno 1024×1024 jak w oryginale, postać wyśrodkowana tak samo, żeby przy przełączaniu klatek
  nie „skakała”. Po wygenerowaniu porównaj obrys z klatką idle; jeśli jest przesunięta lub
  przeskalowana, wyrównaj (przytnij i przesuń) albo wygeneruj ponownie.
- Przezroczyste tło, ten sam kolor niebieski i złota klamra.

**Dodatkowe obrazki (opcjonalne, ale zalecane):**

| Plik | Opis |
|---|---|
| `public/objects/explosion-{1,2,3}.png` | 3 fazy wybuchu (rozbłysk → pełny ogień → dym) do krótkiej animacji zamiast jednej klatki |
| `public/player/hit.png` | robot oberwany (zmrużone oczy, iskry); pokazywany ~300 ms po utracie życia |
| `public/player/win.png`, `public/player/lose.png` | pozy na ekran końcowy: radość z uniesionymi rękami / smutny, przyprószony sadzą |

**Uwaga dla orkiestratora:** jeśli podagent nie ma narzędzia do generowania obrazów, orkiestrator
generuje je sam (`GenerateImage`). Narzędzie zapisuje plik we własnym katalogu (parametr
`filename` nie przyjmuje ścieżki), więc po wygenerowaniu przenieś plik pod docelową ścieżkę w
`public/`.

**Pliki:** tylko nowe pliki w `public/`. Dodatkowo `src/app/assets.js` z mapą ścieżek
(`ASSETS.walls.solid`, `ASSETS.bonuses.speed`…), z której skorzysta T4b.

**Akceptacja:** wszystkie pliki istnieją, mają przezroczyste tło tam, gdzie trzeba, i pasują stylem
do gracza (orkiestrator ogląda je przed zaakceptowaniem). Klatki chodu nałożone na klatkę idle
pokrywają się obrysem głowy i tułowia (różnią się tylko kończyny).

---

### T5. Muzyka w tle + przycisk wyciszenia

**Cel:** zapętlona muzyka („Pszczółka Maja”, Zenon Martyniuk), domyślnie wyciszona, przycisk
włącz/wyłącz.

**Zakres:**
1. Plik: `public/audio/background.mp3` (dostarcza użytkownik). Do czasu dostarczenia kod ma
   działać bez błędów, gdy pliku brak (obsłuż odrzucone `play()` i `error` na elemencie audio).
   **Agent nie pobiera utworu z internetu** (YouTube, serwisy z mp3 itp.), bo utwór jest chroniony
   prawem autorskim. Jego zadaniem jest tylko podpięcie pliku.
   - Dodaj `public/audio/*.mp3` do `.gitignore`, żeby chroniony utwór nie trafił do repozytorium
     ani na publiczny deploy. Jeśli użytkownik zdecyduje inaczej, usuwa ten wpis.
   - Tytuł i wykonawca w `config.js` (`MUSIC_TITLE = "Pszczółka Maja"`,
     `MUSIC_ARTIST = "Zenon Martyniuk"`), wyświetlane jako `title`/tooltip przycisku oraz mały
     napis „♪ Pszczółka Maja – Zenon Martyniuk” obok przycisku, gdy muzyka gra.
2. Hook `useBackgroundMusic()` w `src/app/useBackgroundMusic.js`: tworzy jeden element `<audio>`
   (`loop`, `volume = 0.4`), stan `muted` startuje jako `true` przy każdym wejściu na stronę (bez
   zapamiętywania w localStorage).
3. Odtwarzanie startuje dopiero po kliknięciu „włącz dźwięk”, bo przeglądarki blokują autoplay z
   dźwiękiem i klik jest wymaganym gestem użytkownika. Wyciszenie = `pause()`, odciszenie = `play()`.
4. Komponent `MusicToggle.js` + `MusicToggle.module.css`: przycisk w rogu ekranu z ikoną
   (tymczasowo emoji 🔇/🔊, T4b podmieni na `public/ui/sound-*.png`), `aria-label`, `aria-pressed`.
   Klawisz `M` też przełącza.
5. Muzyka żyje **poza** `GameBoard` (w `page.js`/`GameSession`), żeby restart gry jej nie
   przerywał. Przycisk nie może przechwytywać Spacji (po kliknięciu zdejmij fokus `blur()` albo
   ustaw `tabIndex` i obsłuż `keydown`, żeby Spacja nie przełączała muzyki zamiast stawiać bomby).

**Pliki:** nowe `useBackgroundMusic.js`, `MusicToggle.js`, `MusicToggle.module.css`; edycja
`page.js` (wstawienie komponentu), `.gitignore`, `config.js` (tylko stałe muzyki). **Nie ruszać:**
`GameBoard.js` i logiki gry.

**Akceptacja:** po załadowaniu cisza i ikona „wyciszone”; klik włącza muzykę w pętli; drugi klik
wycisza; restart gry nie przerywa muzyki; Spacja dalej stawia bombę po kliknięciu przycisku; brak
pliku nie wywala błędu w konsoli poza ostrzeżeniem.

---

## Etap 2 (sekwencyjnie)

### T2a. Bonusy: obiekty na mapie i system efektów

**Cel:** bonusy wypadają ze ścian `bonus`, zbierają je gracz i boty, dają efekty czasowe.

**Rodzaje i parametry (wszystko w `config.js`):**

| id | Typ | Efekt | Domyślnie |
|---|---|---|---|
| `immunity` | pozytywny | wybuchy nie odbierają żyć | 10 s |
| `speed` | pozytywny | interwał ruchu × 0.6 | 10 s |
| `range` | pozytywny | zasięg własnych bomb + 2 | 10 s |
| `grenade` | pozytywny | następna „bomba” to granat (T2b) | jednorazowy, bez limitu czasu |
| `slow` | negatywny | interwał ruchu × 1.6 | 10 s |
| `fragile` | negatywny | trafienie odbiera 2 życia zamiast 1 | 10 s |

- Losowanie przy zniszczeniu ściany `bonus`: z szansą `NEGATIVE_BONUS_CHANCE = 0.2` negatywny
  (50/50 `slow`/`fragile`), inaczej pozytywny (równo 4 rodzaje). Negatywny musi być rzadszy
  niż pozytywny; zapewnij to asercją albo testem logiki.
- Typ bonusu losuj w chwili zniszczenia ściany (nie przy generowaniu mapy).
- Na mapie każdy bonus wygląda tak samo (`mystery`), bo typ jest ukryty do momentu zebrania.
- `BONUS_DURATION_MS = 10000`. Ten sam efekt odświeża czas; różne działają równocześnie.
- `speed` i `slow` naraz: mnożniki się mnożą (0.6 × 1.6 ≈ 0.96). `immunity` i `fragile` naraz:
  wygrywa `immunity` (0 obrażeń).
- Bonusy leżące na ziemi **nie** są niszczone przez kolejne wybuchy i nie znikają z czasem
  (parametry `BONUSES_DESTROYED_BY_EXPLOSION = false`, `BONUS_LIFETIME_MS = null`, łatwo zmienić).

**Zakres:**
1. Nowy `src/app/bonus.js` (czysta logika): `rollBonusType(random)`, `spawnBonusesFromWalls(destroyedWalls)`,
   `applyBonus(actor, type, now)`, `expireEffects(actor, now)`, `hasEffect(actor, id, now)`,
   `damageFor(actor, now)` (0/1/2), `rangeFor(actor, now)`.
2. Stan `bonuses: [{ id, row, col, type }]` w `GameBoard`; spawn po każdym wybuchu z
   `destroyedWalls` typu `bonus`.
3. Zbieranie: w momencie, gdy postać (gracz lub bot) wchodzi na pole z bonusem, bonus znika z mapy i
   efekt trafia do `actor.effects`. Boty **nie** szukają bonusów, zbierają je przy okazji.
4. Wpięcie efektów:
   - `moveIntervalFor` (z T0) uwzględnia `speed`/`slow`,
   - `resolveExplosionOutcome` używa `damageFor`,
   - `placeBomb` zapisuje w bombie `range: rangeFor(owner)`, a `getExplosionCells` używa
     `bomb.range`. AI bota (`canEscapeBlast`, wykrywanie zagrożeń) musi liczyć zagrożenie z
     `bomb.range`, nie ze stałej.
   - Wygaszanie efektów w ticku `useGameLoop`.
5. Krótki komunikat po zebraniu (toast nad areną lub w HUD na ~1.5 s), np. „Szybkość!”,
   „Spowolnienie!”, bo na mapie nie widać, co się zbiera.
6. HUD: przy każdej postaci ikonki aktywnych efektów z pozostałym czasem (np. „⚡ 7s”). Na razie
   tekst/emoji, ikony podepnie T4b.
7. Licznik dla statystyk (T6): w stanie gry przechowuj `stats` per postać:
   `{ wallsDestroyed, bonusesCollected: { positive, negative }, kills }` i aktualizuj przy wybuchu
   i zbieraniu. Zabójstwo przypisz właścicielowi bomby (samobójstwo nie liczy się jako kill).

**Pliki:** nowy `bonus.js`, `config.js`, `bomb.js`, `useBomb.js`, `useGameLoop.js`, `actors.js`,
`GameBoard.js`, `Arena.js` (renderowanie bonusów), `Hud.js`, `bot.js` (tylko zasięg zagrożeń).

**Akceptacja:** po zniszczeniu części skrzynek pojawiają się pytajniki; zebranie daje widoczny
efekt i komunikat; efekty wygasają po 10 s; bot wchodzący na bonus też go dostaje; przy wielu
grach negatywnych bonusów jest wyraźnie mniej niż pozytywnych.

---

### T2b. Granat

**Cel:** po zebraniu `grenade` Spacja zamiast bomby rzuca granat.

**Zasady (parametry w `config.js`):**
- Rzut w kierunku `facing` postaci na stałą odległość `GRENADE_THROW_DISTANCE = 2` pola. Granat
  **przelatuje nad** polem pośrednim, nawet jeśli jest tam ściana (dowolnego typu), bomba lub
  postać. Tak realizujemy „przerzucanie przez jedną ścianę”.
- Pole docelowe musi być wolne (brak ściany, obramowania, bomby, mieści się w planszy). Jeśli nie
  jest: spróbuj pola w odległości 1; jeśli też zajęte, **granat nie zostaje zużyty** i w tym
  naciśnięciu stawiana jest zwykła bomba pod nogami.
- Po wylądowaniu granat wybucha jak zwykła bomba: zasięg `BOMB_RANGE` (bonus `range` go **nie**
  zwiększa, bo zadanie mówi „range zwykłej bomby”), timer `GRENADE_TIMER_MS = 2000` od wylądowania.
- Granat jest jednorazowy: po rzucie efekt `grenade` znika. Zebranie kolejnego daje 1 granat (bez
  kumulacji, chyba że później zdecydujemy inaczej).
- Granat liczy się do limitu „1 własny ładunek na mapie” (jak bomba), co upraszcza AI.
- Animacja lotu: obiekt przesuwa się CSS-em z pola rzucającego na pole docelowe w ~250 ms; w tym
  czasie nie blokuje ruchu i nie wybucha.
- Boty z granatem używają go zamiast bomby w chwili, gdy AI zdecydowałoby się postawić bombę.
  `canEscapeBlast` liczy wtedy zagrożenie od pola lądowania.

**Zakres:** `bomb.js` (`getGrenadeTarget(position, facing, walls, borders, bombs)` jako czysta
funkcja), `useBomb.js` (`throwGrenade`), `playerMovement.js`/`usePlayerControls.js` (Spacja), `bot.js`,
`Arena.js` (render granatu w locie i na ziemi).

**Akceptacja:** gracz z granatem stojący przy ścianie rzuca go za nią i niszczy coś po drugiej
stronie; po rzucie kolejna Spacja stawia zwykłą bombę; bot z granatem też go rzuca i nie ginie od
niego za każdym razem.

---

### T8. Animacja kroku postaci (równolegle z T2a/T2b)

**Cel:** postać nie „ślizga się” między polami, tylko idzie: przebiera nogami i lekko się
kołysze. Dotyczy gracza i botów (ten sam komponent i te same klatki).

**Jak dziś działa ruch:** pozycja zmienia się skokowo o jedno pole, a CSS `transition` na
`left/top` przesuwa sprite płynnie przez czas interwału ruchu (`moveIntervalFor` z T0). Animacja
kroku ma być zsynchronizowana z tym przejściem.

**Zasady animacji:**
- Cykl chodu: `idle → krok-1 → idle → krok-2`. Jeden ruch o pole odtwarza **pół cyklu**:
  pierwsza połowa przejścia pokazuje `walk/{dir}-1` (albo `-2`, naprzemiennie przy kolejnych
  polach), druga połowa `{dir}.png` (idle). Kolejne pole zaczyna się od drugiej nogi, więc
  przy ciągłym marszu nogi się przeplatają.
- Czas klatki = `moveIntervalFor(actor, now) / 2`, czyli bonus `speed` przyspiesza przebieranie
  nogami, a `slow` je spowalnia.
- Gdy postać nie rusza się dłużej niż jeden interwał, wraca do klatki idle i licznik nogi się
  zeruje.
- Dodatkowo lekki „bob”: `translateY(-4%)` w połowie kroku (CSS `@keyframes` o długości
  interwału, uruchamiany przy każdej zmianie pola). Bez wpływu na hitbox i pozycję logiczną.
- Zmiana kierunku w miejscu (gracz wcisnął strzałkę w ścianę) tylko obraca postać, bez kroku.
- Jeśli T4a dostarczył `hit.png`: po utracie życia przez ~300 ms pokazuj tę klatkę zamiast
  chodu (miganie przezroczystością jako fallback, gdy pliku nie ma). Dla botów to samo, z filtrem
  koloru.
- Animacja nie może wymuszać re-renderu całej areny co klatkę. Stan klatki trzymaj lokalnie w
  `ActorSprite` (np. `useState` + `setTimeout` uruchamiany przy zmianie `position`) albo zrób
  ją czysto w CSS (`@keyframes` z `steps()` i przełączaniem `background-image`/dwóch `<img>`).
- **Preload** wszystkich klatek przy starcie gry (np. ukryte `<img>` albo `new Image()` w efekcie),
  żeby pierwszy krok nie migał podczas ładowania obrazka.
- `prefers-reduced-motion: reduce`: wyłącz bob, zostaw tylko przełączanie klatek.

**Pliki:** `ActorSprite.js`, `ActorSprite.module.css`, `assets.js` (ścieżki klatek), ewentualnie
nowy `useWalkAnimation.js`. **Nie ruszać:** logiki ruchu (`playerMovement.js`, `bot.js`,
`useGameLoop.js`); animacja tylko czyta `position`, `facing` i interwał ruchu.

**Zależności:** T0 (`ActorSprite`, `moveIntervalFor`), T3 (przebarwienia botów), T4a (klatki).

**Akceptacja:** przytrzymanie strzałki daje płynny marsz z przeplatającymi się nogami; po
puszczeniu postać staje w pozie idle; boty też chodzą animowanie w swoich kolorach; z bonusem
szybkości animacja jest szybsza; w zakładce Network nie ma doładowywania klatek w trakcie gry.

---

## Etap 3 (równolegle)

### T6. Ekran końcowy ze statystykami i restartem

**Cel:** po końcu gry pełnoekranowa nakładka z wynikiem, statystykami i możliwością ponownej gry.

**Zakres:**
1. `EndScreen.js` + `EndScreen.module.css`: nakładka nad areną (lub całym ekranem) z tłem
   `public/ui/end-background.png` (do czasu T4b gradient CSS), pojawia się z krótką animacją fade-in.
2. Treść:
   - nagłówek: „Wygrana!” / „Przegrana!” / „Remis!”,
   - podtytuł: kto przetrwał (przy przegranej: które boty przeżyły) i kolejność eliminacji,
   - statystyki gracza: czas gry (mm:ss), zniszczone ściany, zebrane bonusy (pozytywne/negatywne),
     pokonane boty, pozostałe życia,
   - opcjonalnie mała tabela tych samych liczb dla botów.
3. Czas gry: znacznik startu przy rozpoczęciu rundy, stop przy zmianie statusu z `"playing"`.
   Kolejność eliminacji: zapisuj `diedAt` w aktorze przy `alive=false`.
4. „Zagraj ponownie”: przycisk (autofocus) + klawisz Enter wywołują `onRestart` z `GameSession`
   (T0), który zmienia `key` `GameBoard`. Komponent montuje się od nowa: nowy labirynt, nowe
   pozycje, zerowe statystyki, wszystkie timery bomb wyczyszczone (sprawdź, że `useBomb` czyści
   timery przy odmontowaniu, czyli że stare bomby nie wybuchają w nowej grze).
5. Po końcu gry klawiatura nie steruje postacią (już tak jest przez `gameStatus`), a Spacja nie
   powinna „klikać” przycisku restartu przypadkiem w trakcie spamowania bomb. Restart tylko
   Enterem lub kliknięciem, Spację ignoruj przez pierwsze ~500 ms po pojawieniu się ekranu.
6. Usuń stary tekstowy komunikat końca z `Hud.js` (zastąpiony ekranem).

**Pliki:** nowe `EndScreen.js`, `EndScreen.module.css`, `gameStats.js` (formatowanie); edycja
`GameBoard.js` (render nakładki, przekazanie stats), `page.js`/`GameSession`, `Hud.js`.
**Nie ruszać:** `Arena.js`, `WallBlock.js`, CSS-ów obiektów (to T4b).

**Akceptacja:** każdy z trzech wyników pokazuje poprawny ekran; statystyki zgadzają się z
przebiegiem gry; restart 5× pod rząd nie zostawia „duchów” bomb ani podwójnych botów; muzyka gra
dalej przez restart.

---

### T4b. Podpięcie grafik

**Cel:** zastąpić kolorowe kwadraty grafikami z T4a.

**Zakres:**
1. `WallBlock.js`: `solid` / `destructible` / `bonus` (ten sam obrazek co `destructible`) /
   obramowanie przez `background-image` z `assets.js`.
2. Arena: podłoga (`floor.png` jako powtarzane tło), bomba (lekkie pulsowanie CSS), granat
   (obrót w locie), wybuch (`explosion.png`, krótkie skalowanie), bonus `mystery.png` (delikatne
   unoszenie/połysk).
3. Boty: ocenić filtr `hue-rotate` z T3 (także na klatkach chodu z T8); jeśli kolory wyglądają
   źle (np. złota klamra zmienia kolor), użyć osobnych sprite'ów z `public/bots/...`, ale wtedy
   łącznie z klatkami chodu dla każdego koloru.
   Wybuch: jeśli są `explosion-{1,2,3}.png`, odtwarzaj je po kolei przez `EXPLOSION_DURATION_MS`.
   Ekran końcowy: jeśli są `win.png`/`lose.png`, wstaw pozę robota obok wyniku (podmiana w
   `EndScreen.js`, tylko warstwa wizualna).
4. HUD: ikony efektów z `public/bonuses/*.png` zamiast emoji; przycisk muzyki z `public/ui/sound-*.png`.
5. Nie zmieniać logiki gry, tylko warstwę wizualną. Obrazy przez `<img>` lub `background-image`
   (jak obecnie w `Player.js`); jeśli używasz `next/image`, najpierw przeczytaj docs w
   `node_modules/next/dist/docs/`.

**Pliki:** `WallBlock.js`, `Arena.js`, `ActorSprite.js`, CSS modules obiektów, `Hud.js` (tylko ikony),
`MusicToggle.js` (tylko ikona), `page.module.css`. **Nie ruszać:** `EndScreen.*` poza podmianą
ścieżki tła i wstawieniem pozy robota, jeśli T6 już skończył. Logiki animacji chodu w
`ActorSprite` (T8) nie przerabiać, tylko ewentualnie podmienić ścieżki sprite'ów botów.

**Akceptacja:** na planszy nie ma już „gołych” kolorowych kwadratów; obiekty są czytelne w
rozmiarze pola (~67 px); brak błędów 404 w konsoli.

---

## Etap 4

### T7. Przegląd końcowy i balans

- Pełna rozgrywka kilka razy: sprawdzić wydajność (tick 50 ms × 4 postacie × N bomb, do tego
  animacje kroku), brak wycieków timerów, brak ostrzeżeń React w konsoli.
- Strojenie w `config.js`: szanse bonusów, czasy efektów, prędkości botów (czy gra nie jest za
  łatwa/trudna z 3 botami).
- Uzupełnić `README.md`: sterowanie (WASD/strzałki, Spacja, M), lista bonusów i ich efektów,
  ścieżka pliku muzyki.
- Przegląd kodu (opcjonalnie podagent `bugbot` na całej gałęzi).

---

## Rzeczy do dostarczenia przez użytkownika

- `public/audio/background.mp3`: „Pszczółka Maja” w wykonaniu Zenona Martyniuka, zapętlana.
  Bez pliku przycisk działa, ale jest cisza. Plik jest w `.gitignore` (utwór chroniony prawem
  autorskim), więc każdy, kto klonuje repo, musi go dograć sam.

## Otwarte parametry (mają wartości domyślne, można zmienić później w `config.js`)

- Odległość rzutu granatu: 2 pola.
- Zachowanie granatu, gdy pole docelowe jest zajęte: zwykła bomba, granat zostaje.
- Szansa na bonus w ścianie: 40%; szansa, że bonus jest negatywny: 20%.
- Bonusy na ziemi nie giną od wybuchów i nie znikają z czasem.
- Filary (pola parzyste/parzyste) jako ściany niezniszczalne.
