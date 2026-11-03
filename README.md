# Bomb-It

Gra w labirynt: stawiasz bomby, niszczysz skrzynki i starasz się przeżyć dłużej niż trzy boty.

## Uruchomienie

```bash
npm install
npm run dev
```

Gra jest pod adresem [http://localhost:3000](http://localhost:3000).

## Sterowanie

- **WASD** lub **strzałki** — ruch
- **Spacja** — bomba. Po zebraniu granatu ten sam klawisz rzuca go w kierunku patrzenia
- **M** — włącz lub wyłącz muzykę (na starcie jest wyciszona)
- **Enter** — nowa runda na ekranie końcowym

## Bonusy

Skrzynki z bonusem wyglądają tak samo jak zwykłe. Na mapie widać tylko pytajnik. Efekt trwa 10 sekund, a ten sam bonus odświeża czas.

- Tarcza — odporność na wybuchy
- Błyskawica — szybszy ruch
- Płomień ze strzałkami — bomby o większym zasięgu
- Granat — jeden rzut o zasięgu zwykłej bomby, przelatuje nad jedną ścianą
- Ślimak — wolniejszy ruch
- Pęknięte serce — trafienie zabiera 2 życia

Negatywny bonus wypada rzadziej niż pozytywny.

## Muzyka

Wrzuć plik do `public/audio/background.mp3`. W tej wersji ma to być „Pszczółka Maja” Zenona Martyniuka. Plik jest w `.gitignore` i nie trafia do repozytorium. Bez niego przycisk działa, ale nic nie gra.
