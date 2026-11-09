# Frontend na Cloudflare Pages

Plan dotyczy tylko tego repozytorium. Gra zostaje taka, jaka jest dziś: runda liczy się w przeglądarce. Serwer z `bomb-it-backend`, EC2 i `wss://` nie wchodzą w tę konfigurację. Strona na Pages ma dać się otworzyć i grać bez żadnego procesu Node.

`HOSTING.md` opisuje Pages tak, jakby w aplikacji nie było tras API. Jest `src/app/api/music/route.js` (`force-dynamic`, czyta dysk). Przy `output: "export"` Next odmawia buildu, dopóki ta trasa istnieje. Ten plan najpierw ją usuwa, potem wystawia statyczny `out/`.

Muzyka nie jedzie z gita. `public/audio/*.mp3` jest w `.gitignore`. Build podłączony do repozytorium wgra grę bez utworów. Utwory wchodzą na Pages tylko przy ręcznym `wrangler pages deploy` z maszyny, na której pliki leżą na dysku.

---

## Cel

- `https://bomb-it.pages.dev` (dokładna nazwa zależy od konta) pokazuje tę samą grę co `next dev`.
- Brak serwera jest niewidoczny: solo, boty, bomby i restart działają w przeglądarce.
- Lista utworów bierze się z pliku statycznego, nie z trasy API.
- Lokalny `next dev` dalej widzi utwory z `public/audio`, także po dorzuceniu pliku i ponownym wygenerowaniu listy.

---

## Etap 1. Lista utworów bez trasy API

Logika tagów ID3 z `src/app/api/music/route.js` przechodzi do `scripts/write-music-manifest.js`. Skrypt czyta `public/audio`, pomija nazwy zaczynające się od kropki i pliki inne niż `.mp3`, i zapisuje `public/audio/tracks.json`:

```json
[{ "id": "plik.mp3", "title": "…", "artist": "…", "src": "/audio/plik.mp3" }]
```

Pusty katalog albo brak katalogu daje `[]`. Tytuł i wykonawca biorą się z `TIT2` i `TPE1`, a gdy tagu nie ma, z nazwy pliku, tak jak dziś.

`useBackgroundMusic.js` pobiera `/audio/tracks.json` zamiast `/api/music`. Błąd sieci i pustą tablicę traktuje jak dziś: brak listy, bez wyjątku w konsoli poza ewentualnym ostrzeżeniem od samego `<audio>`.

`src/app/api/music/route.js` znika. Katalog `src/app/api/` też, gdy zostanie pusty.

Skrypty:

- `predev` i `prebuild` wołają `node scripts/write-music-manifest.js`
- po wrzuceniu nowego `.mp3` w trakcie działającego `next dev` listę odświeża ponowne `npm run dev` albo sam skrypt

`public/audio/tracks.json` dopisać do `.gitignore` obok mp3. Plik powstaje na maszynie, która ma utwory, i przy buildzie trafia do `out/audio/`. W repozytorium go nie ma, więc build z czystego klona dostaje pustą listę.

Akceptacja: `npm run dev` pokazuje te same utwory co wcześniej. W `src/app` nie ma trasy `route.js`. `npm run build` przechodzi.

---

## Etap 2. Eksport statyczny

W `next.config.mjs` dopisać `output: "export"`. Obrazków przez `next/image` nie ma, więc optymalizacja obrazów nie wymaga wyłączenia. `reactCompiler` zostaje.

Build zapisuje stronę do `out/`. Katalog `out/` jest już w `.gitignore`.

Skrypty i zależność, jak przy ruderze:

```json
{
  "devDependencies": {
    "wrangler": "^4.113.0"
  },
  "scripts": {
    "dev": "next dev",
    "predev": "node scripts/write-music-manifest.js",
    "build": "next build",
    "prebuild": "node scripts/write-music-manifest.js",
    "pages:dev": "wrangler pages dev out --port 5501",
    "deploy": "wrangler pages deploy out --project-name bomb-it"
  }
}
```

Do `.gitignore` dopisać `.wrangler`. `.dev.vars` nie jest potrzebne: na Pages nie ma sekretu. Adres gry nie jest osobnym API.

Brak `wrangler.toml`. Projekt powstaje przy pierwszym `npm run deploy` na tym samym koncie Cloudflare co rudera. Nazwa projektu: `bomb-it`.

Akceptacja: `npm run build` kończy się katalogiem `out/` z `index.html`, sprite'ami z `public/` i `audio/tracks.json`. W logu buildu nie ma żądania trasy serwerowej.

---

## Etap 3. Podgląd eksportu

`npm run build`, potem `npm run pages:dev`. Gra pod `http://127.0.0.1:5501`.

Akceptacja, na wyeksportowanych plikach, nie na `next dev`:

- ruch, bomba, bot, restart,
- utwory z lokalnego `public/audio` są na liście i grają,
- w zakładce sieci nie ma requestu do `/api/music`,
- odświeżenie strony nie woła Node z tego repozytorium poza procesem Wranglera serwującym pliki.

---

## Etap 4. Deploy z maszyny, która ma muzykę

Na tej maszynie leżą pliki `public/audio/*.mp3`.

1. `npx wrangler login`, jeśli konto nie jest jeszcze podpięte.
2. `npm run build`
3. `npm run deploy`

Pierwszy deploy tworzy projekt `bomb-it`. Adres roboczy wypisuje Wrangler (`bomb-it.pages.dev` albo z sufiksem konta).

Akceptacja na telefonie poza własnym Wi-Fi, zwykłym adresem `https://`:

- gra solo działa i po odświeżeniu nadal działa,
- lista utworów zgadza się z plikami, które były na dysku przy buildzie,
- brak pliku mp3 na dysku przy kolejnym buildzie skraca listę po następnym deployu.

Deploy z gita (Build command `npm run build`, katalog `out`) może dojść później i wgra tę samą grę. Utworów nie wgra, bo nie ma ich w klonie. Dopóki muzyka ma być na stronie, źródłem deployu jest ta maszyna, nie czysty clone.

---

## Poza zakresem

- `bomb-it-backend`, pokoje, WebSocket, EC2, Caddy,
- zmiana `HOSTING.md`,
- Pages Function i sekrety w panelu,
- trzymanie mp3 w repozytorium,
- podmiana klienta na rysowanie stanu z serwera. Gdy runda przejdzie na backend, ten sam projekt Pages zostaje. Zmieni się kod gry w przeglądarce, nie konfiguracja katalogu `out/`.
