# Campus Conquerors

Juego de running gamificado para estudiantes universitarios de Barcelona. Elige tu
universidad (UB, UPC, UPF o UAB), sal a correr y pinta la ciudad con tu color: cada
hexágono H3 que atraviesas se conquista para tu facción y la niebla de guerra se despeja.

Construido con **React Native + Expo** (SDK 57), `react-native-maps` (Google Maps en
Android), `expo-location` y `h3-js`. Todo el estado es local — sin backend — para que la
demo funcione al instante.

## Ejecutar en Android con Expo Go

```bash
npm install
npx expo start
```

Escanea el QR con la app **Expo Go** en tu Android. Concede el permiso de ubicación
cuando se solicite.

## Demo para el jurado (modo simulador)

En la pantalla del mapa, **toca 5 veces seguidas el escudo de tu universidad** (arriba a
la izquierda). Aparecerá un botón ▶ que ignora el GPS e inyecta una carrera por
Plaça Catalunya → Passeig de Gràcia → Diagonal → Francesc Macià, pintando hexágonos en
vivo y sobrescribiendo los puestos rivales por el camino. Pulsa ■ o la X del
indicador "SIMULACIÓN" para volver al GPS real.

## Features

- **Selección de facción**: la UI entera (botones, tab bar, acentos, trazo) se re-pinta con
  el color de la universidad elegida.
- **Turf War**: tracking GPS real con `expo-location`; los hexágonos H3 (res. 10, ~66 m)
  cruzados pasan a ser tuyos. Los territorios rivales se sobrescriben.
- **Niebla de guerra**: hexágonos inexplorados alrededor del corredor renderizados como
  cristal esmerilado blanco semitransparente; los conquistados en neón translúcido.
- **Swarm ×3**: botón flotante que simula compañeros corriendo contigo y triplica los
  puntos de conquista durante 45 s.
- **Ranking + Gran Final UniRun**: clasificación UB/UPC/UPF/UAB por hexágonos y banner
  con cuenta atrás al evento oficial de 5 km (límite 1 h).

## Estructura

```
src/
  app/                 # rutas Expo Router
    _layout.tsx        # GameProvider + Stack
    index.tsx          # onboarding / selección de universidad
    (tabs)/            # bottom tabs: map, leaderboard
  components/          # HexLayer, SwarmButton, UniRunBanner
  context/             # GameContext: facción, territorio, GPS, simulador, swarm
  constants/           # universidades y paleta
  lib/                 # helpers H3 y ruta de simulación
```

## Comandos

```bash
npm run lint       # expo lint
npm run typecheck  # tsc --noEmit
npx expo-doctor    # comprobar dependencias
```
