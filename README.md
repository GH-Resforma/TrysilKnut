# Trysil-Knut løyper

En liten kartapp (PWA) for løypene i Trysil-Knuts fjellverden. Den viser:

- Kartverkets topografiske kart
- løypenettet i rødt
- hvor du er, og hvor langt det er til nærmeste løype

Kartet kan lagres på telefonen, så appen virker uten mobildekning.

## Bruk på iPhone

1. Åpne appens adresse i **Safari**.
2. Trykk **Del** og velg **Legg til på Hjem-skjerm**.
3. Åpne appen fra hjemskjermen. Velg **Meny → Last ned kart** mens du er på wifi. Det er omtrent 75 MB og tar et par minutter.
4. Trykk på posisjonsknappen og gi appen tilgang til posisjon.

Tips: Åpne appen én gang før turen for å sjekke at det står «Kartet er lagret på telefonen» i menyen.

## Publisering (GitHub Pages)

Gå til **Settings → Pages**. Velg *Deploy from a branch*, deretter branch `main` og mappe `/ (root)`.
Appen blir da tilgjengelig på `https://gh-resforma.github.io/trysilknut/`.

Det trengs ingen byggesteg. Filene serveres som de er.

## Innhold

| Fil | Hva |
| --- | --- |
| `index.html`, `app.js`, `style.css` | Selve appen (Leaflet) |
| `sw.js` | Service worker som lagrer app og kart for bruk uten dekning |
| `data/loyper.geojson` | Løypene som appen viser |
| `data/Trysilknut-loyper.gpx` / `.kml` | Samme løyper for andre apper (OsmAnd, Gaia, Garmin, Google Earth) |
| `tools/digitalisering/` | Python-skriptene som digitaliserte løypene fra turkartet |

## Om løypedataene

Løypene er digitalisert fra turkartet på [trysilknutfjellverden.no](https://www.trysilknutfjellverden.no/). Kartet er kalibrert mot UTM-rutenettet (sone 32, 1 km) og stedsnavn fra Kartverket. Linjene kan avvike **30–60 m** fra faktisk trasé, så følg merking og spor i terrenget.

Disse er ikke med ennå:

- løypene nord for Simenstua (Lægeret, Fiskebekkhøa)
- stiplede traseer

## Kreditering

- Kart © [Kartverket](https://www.kartverket.no/), CC BY 4.0
- [Leaflet](https://leafletjs.com/), BSD-2-Clause (se `vendor/leaflet/LICENSE`)
- Løypene vedlikeholdes av Trysil-Knuts fjellverden
