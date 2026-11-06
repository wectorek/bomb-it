# Bomb-It

Gra w labirynt: stawiasz bomby, niszczysz skrzynki i starasz się przeżyć dłużej niż trzy boty.

## Uruchomienie

```bash
npm install
npm run dev
```

Gra jest pod adresem [http://localhost:3000](http://localhost:3000).

## Sterowanie

- **WASD** lub **strzałki** — ruch. Na telefonie ten sam ruch jest na krzyżaku, a bomba na okrągłym przycisku
- **Spacja** — bomba. Po zebraniu granatu ten sam klawisz rzuca go w kierunku patrzenia
- **M** — włącz lub wyłącz muzykę (na starcie jest wyciszona). Klik w głośnik otwiera utwory, wyciszenie, strefę i motyw planszy
- **Enter** — nowa runda na ekranie końcowym

Żywopłot niszczy się jak skrzynka i odrasta po 8 sekundach, jeśli pole jest wolne. Motyw planszy (główny, pszczeli, religijny, AI, kosmiczny) zmienia podłogę i ściany. Główny to wygląd sprzed motywów: ciemna podłoga, drewno i kamień.

## Bonusy

Skrzynki z bonusem wyglądają tak samo jak zwykłe. Na mapie widać tylko pytajnik. Efekt trwa 10 sekund, a ten sam bonus odświeża czas.

- Tarcza — odporność na wybuchy
- Błyskawica — szybszy ruch
- Płomień ze strzałkami — bomby o większym zasięgu
- Granat — jeden rzut o zasięgu zwykłej bomby, przelatuje nad jedną ścianą
- Ślimak — wolniejszy ruch
- Pęknięte serce — trafienie zabiera 2 życia
- Płatek — zatrzymanie na 3 sekundy

Bonus przeciwny kasuje ten, który już działa: tarcza i kruchość, szybkość i spowolnienie, szybkość i zatrzymanie. Negatywny bonus wypada rzadziej niż pozytywny.

## Muzyka

Przycisk w prawym dolnym rogu otwiera wyciszenie i listę utworów. Każdy plik `.mp3` wrzucony do `public/audio` pojawia się tam sam. Nazwa bierze się z tytułu w pliku, a gdy go nie ma, z nazwy pliku. Pliki mp3 są w `.gitignore`.
