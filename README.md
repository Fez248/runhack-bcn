# Campus Conquerors

Gamified running game for university students in Barcelona. Pick your university
(UB, UPC, UPF or UAB), go for a run and paint the city in your color: every H3 hexagon you
cross is conquered for your faction and the fog of war clears around you.

Built with **React Native + Expo** (SDK 57), **OpenStreetMap** tiles rendered with Leaflet
inside a WebView (no Google Maps API key needed — works in Expo Go), `expo-location` and
`h3-js`. All state is local — no backend — so the demo works instantly.

## Test it on your Android phone (Expo Go)

1. Install **Expo Go** from the Play Store on your phone.
2. On your computer:

   ```bash
   npm install
   npx expo start --tunnel
   ```

   `--tunnel` makes it work even if the phone and laptop are on different Wi-Fi networks
   (e.g. phone on 4G). If both are on the same Wi-Fi you can drop the flag.
3. Open Expo Go and scan the QR code shown in the terminal (or use the camera app).
4. Allow location access when prompted. Pick a university and start walking — or use
   demo mode below.

The phone needs internet access to load the OpenStreetMap tiles.

### Standalone APK (no laptop needed)

```bash
npx eas-cli@latest build --platform android --profile preview
```

Requires a free Expo account. EAS produces an installable `.apk` link you can open on
the phone directly.

## Hackathon demo (simulator mode)

On the map screen, **tap your university badge 5 times quickly** (top-left). A ▶ button
appears that ignores real GPS and injects a run along Plaça Catalunya → Passeig de Gràcia →
Diagonal → Francesc Macià, painting hexes live and overwriting rival outposts on the way.
Press ■ or the X on the "DEMO RUN" pill to return to real GPS.

The game starts pre-seeded with fake season data: campus strongholds for every university
(Plaça Universitat, Campus Nord, Ciutadella, Plaça Espanya, …), rival outposts along the
demo route and season points, so the leaderboard is alive from the first second.

## Features

- **Faction select**: the whole UI (buttons, tab bar, accents, track) re-themes to the
  chosen university color.
- **Turf War**: real GPS tracking with `expo-location`; H3 hexagons (res. 10, ~66 m)
  you cross become yours. Rival territory gets overwritten.
- **Fog of war**: unexplored hexes around the runner rendered as translucent frosted
  white glass; conquered ones in translucent neon.
- **Swarm ×3**: floating button that simulates teammates running with you and triples
  conquest points for 45 s.
- **Ranking + UniRun Grand Final**: UB/UPC/UPF/UAB standings by hexes and a countdown
  banner to the official 5 km race (1 h cut-off).

## Structure

```
src/
  app/                 # Expo Router routes
    _layout.tsx        # GameProvider + Stack
    index.tsx          # onboarding / university selection
    (tabs)/            # bottom tabs: map, leaderboard
  components/          # LeafletMap (OSM + hex overlays), SwarmButton, UniRunBanner
  context/             # GameContext: faction, territory, GPS, simulator, swarm, seeded demo data
  constants/           # universities & palette
  lib/                 # H3 helpers, demo route, Hermes polyfills
```

## Commands

```bash
npm run lint       # expo lint
npm run typecheck  # tsc --noEmit
npx expo-doctor    # check dependencies
```
