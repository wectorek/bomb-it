# Hosting Bomb-It: Cloudflare Pages + AWS EC2

Plan wdrożenia. Strona i gra w przeglądarce idą na Cloudflare Pages tym samym sposobem co frontend rudery. Serwer partii dla wielu graczy stoi na AWS EC2. Przeglądarka łączy się z nim bezpośrednio, tak jak rudera łączy się ze swoim backendem.

## Co jest w ruderze

Frontend (`rudera`):

- Cloudflare Pages, Wrangler `^4.113.0` jako `devDependency`.
- Skrypty: `wrangler pages dev src --port 5501` i `wrangler pages deploy src`.
- Brak `wrangler.toml`. Projekt Pages powstaje przy pierwszym deployu albo w panelu.
- Katalog wrzucany na Pages to statyczne pliki (`src`).
- Sekret (klucz Firebase) nie leży w repo. Pages Function `functions/api/firebase-config.js` czyta `FIREBASE_API_KEY` ze zmiennej ustawionej w panelu: Settings → Environment variables → Secret. Lokalnie ta sama nazwa jest w `.dev.vars` (plik w `.gitignore`, wzór w `.dev.vars.example`). Katalog `functions/` jest w korzeniu repo, niezależnie od katalogu buildu.
- Adres backendu wybiera przeglądarka (`src/js/env.js`, `src/js/apis/backend.js`):
  - hostname `localhost` / `127.0.0.1` → `http://127.0.0.1:8787`
  - inaczej → stały adres produkcji
  - nadpisanie: `window.RUDERA_API_URL`

Backend rudery to Worker (`wrangler deploy`, Hono, otwarty CORS). Tego układu nie przenosimy. W Bomb-It backendem jest proces Node na EC2.

## Docelowy układ

| Warstwa | Gdzie | Rola |
|---|---|---|
| Strona, plansza, HUD, assety | Cloudflare Pages | To, co dziś robi Next.js w przeglądarce |
| Partia wielu graczy | EC2, jeden proces Node | Tick, labirynt, bomby, boty, pokoje |
| DNS | Cloudflare | Rekord strony na Pages, rekord serwera gry na Elastic IP |
| Konta, ranking | później | Poza tym planem |

Jedna partia to jeden pokój w pamięci procesu. Gracz wysyła intencję (krok, bomba, granat). Serwer sprawdza zasady i co około 50 ms rozsyła stan planszy. Boty liczy ten sam proces. Po meczu stan znika z RAM.

Gra jednoosobowa działa na samym Pages, bez EC2. Połączenie z serwerem jest potrzebne dopiero po wejściu do pokoju.

## Frontend na Cloudflare Pages

Next.js zostaje. Na Pages trafia statyczny wynik buildu, bo cała obecna gra jest kliencka (`"use client"`, brak tras API).

1. W `next.config.mjs` ustaw `output: "export"`. Build zapisuje pliki do `out/`.
2. Zależności i skrypty, wzorowane na `rudera/package.json`:

```json
{
  "devDependencies": {
    "wrangler": "^4.113.0"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "pages:dev": "wrangler pages dev out --port 5501",
    "deploy": "wrangler pages deploy out --project-name bomb-it"
  }
}
```

3. `npm run build`, potem `npm run deploy`. Pierwszy deploy loguje Wranglera na to samo konto Cloudflare co rudera. Projekt w panelu: `bomb-it`. Adres roboczy: `bomb-it.pages.dev` (dokładna nazwa zależy od konta).
4. Deploy z gita, tak jak Pages Function rudery zakłada podłączenie repozytorium: Build command `npm run build`, Build output directory `out`, katalog `functions/` w korzeniu, jeśli kiedyś dojdzie.
5. Do `.gitignore` dopisać `.wrangler` i `.dev.vars`, jak w ruderze.

Adres serwera gry trzymaj tak jak rudera trzyma adres API, w jednym module czytanym w przeglądarce:

- lokalnie (`localhost`) → `ws://127.0.0.1:8787`
- na Pages → `wss://gra.twoja-domena` (uzupełnić przy stawianiu EC2)
- nadpisanie na czas prób: `window.BOMB_IT_WS_URL`

Adres WebSocketa jest publiczny, więc nie potrzeba Pages Function ani sekretu w panelu. Function dokładamy tylko wtedy, gdy pojawi się wartość, która nie ma leżeć w repo.

Assety (`public/`, w tym `public/audio/background.mp3`) wchodzą do `out/` przy buildzie. Muzyka i sprite'y ładują się z domeny Pages.

## Serwer gry na EC2

Region `eu-central-1` (Frankfurt). Na start instancja `t3.small`, Ubuntu LTS, Elastic IP. Jeden taki proces udźwignie dziesiątki równoległych partii po kilku graczy. Nowa partia zostaje na tej instancji do końca meczu.

Grupa bezpieczeństwa:

- 22/tcp tylko z własnego IP (SSH)
- 80/tcp i 443/tcp z `0.0.0.0/0` (Caddy: przekierowanie i `wss`)
- port aplikacji Node nie jest otwarty na świat; słucha na localhost, na zewnątrz wychodzi tylko Caddy

Na instancji:

1. Node.js w tej samej głównej wersji co lokalnie.
2. Katalog z logiką gry odpaloną poza Reactem: czyste moduły (`maze.js`, `bomb.js`, `bot.js`, model postaci) importowane przez proces serwera. Hooki Reacta zostają w przeglądarce i tylko wysyłają intencje oraz rysują stan.
3. Serwer HTTP + WebSocket na `127.0.0.1:8787` (ten sam numer portu co lokalny backend rudery, żeby lokalny i produkcyjny schemat były czytelne).
4. `systemd`: unit uruchamia proces przy starcie maszyny i podnosi go po crashu.
5. Caddy na 443 z certyfikatem Let's Encrypt dla nazwy serwera gry. Przeglądarka otwarta na `https://….pages.dev` może otworzyć tylko `wss://`, więc goły `ws://` i samo IP odpadają.
6. Przy upgrade WebSocketa serwer przyjmuje połączenia z originów Pages (`https://bomb-it.pages.dev` i docelowa domena strony).

Rekord DNS w Cloudflare dla nazwy serwera gry (np. `gra`) wskazuje na Elastic IP i jest **tylko DNS** (szara chmurka). Ruch gry nie przechodzi przez proxy Cloudflare. Certyfikat wystawia Caddy na instancji, a długa partia nie zależy od limitu bezczynności proxy.

Aktualizacja serwera: wejście po SSH, pobranie wersji, restart unitu. Stronę na Pages wdraża się osobno (`npm run deploy`) i można ją wypuścić bez ruszania EC2, dopóki protokół wiadomości się nie zmienia.

## Protokół (minimum)

Klient → serwer:

- `join` z kodem pokoju i nickiem
- `input`: kierunek albo postawienie bomby / granatu

Serwer → klient:

- `welcome` z id gracza
- `state` co tick: pozycje, życia, bomby, wybuchy, bonusy, status partii
- `error`, gdy ruch odrzucono

Pokój na 4 miejsca. Wolne miejsca może zająć bot liczony na serwerze. Kod pokoju generuje serwer przy `create`. Dołączenie drugiego gracza z innego komputera to ten sam kod i adres `wss://`.

Lokalnie: `next dev` plus ten sam proces Node na `127.0.0.1:8787`. Na Pages przeglądarka sama przełącza się na adres produkcji, według hostname, jak `ENV` w ruderze.

## Kolejność

1. Statyczny export i deploy strony na Pages (gra jednoosobowa, bez serwera).
2. Proces Node z obecną logiką planszy, jeden pokój, WebSocket, odpalony lokalnie.
3. Podpięcie klienta: wysyłka intencji, rysowanie stanu z serwera, wybór adresu jak w ruderze.
4. Instancja EC2, Caddy, Elastic IP, rekord DNS, origin dozwolony dla domeny Pages.
5. Partia z dwóch komputerów: jeden tworzy pokój, drugi wchodzi kodem.
