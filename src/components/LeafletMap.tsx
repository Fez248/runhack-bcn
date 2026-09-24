import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { BASE, UNIVERSITIES, withAlpha, type UniversityId } from '@/constants/universities';
import { boundaryFor, cellFor, fogAroundCell, type LatLng } from '@/lib/hexGrid';

export type MapCommand =
  | { type: 'center'; center: LatLng; zoom?: number }
  | { type: 'fit'; bounds: [LatLng, LatLng] };

type Props = {
  territory: Record<string, UniversityId>;
  position: LatLng | null;
  track: LatLng[];
  accent: string;
  follow: boolean;
  showRunner: boolean;
  initialCenter: LatLng;
  onUserPan?: () => void;
  onReady?: () => void;
};

type Frame = {
  fog: number[][][];
  hexes: { c: number[][]; f: string; s: string }[];
  track: number[][];
  pos: number[] | null;
  accent: string;
  follow: boolean;
  runner: boolean;
};

const toPairs = (pts: LatLng[]) => pts.map((p) => [round(p.latitude), round(p.longitude)]);
const round = (n: number) => Math.round(n * 1e6) / 1e6;

const HTML = `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  html,body,#map{margin:0;height:100%;width:100%;background:${BASE.background};}
  .leaflet-control-attribution{font-size:9px;opacity:.75}
  .runner{width:22px;height:22px;border-radius:50%;background:#fff;border:3px solid var(--accent);box-shadow:0 0 0 6px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center}
  .runner::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--accent)}
</style></head><body><div id="map"></div>
<script>
(function(){
  var map = L.map('map',{zoomControl:false,attributionControl:true,preferCanvas:true}).setView([__LAT__,__LNG__],15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{
    maxZoom:19,subdomains:'abcd',
    attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
  }).addTo(map);
  var fogLayer = L.layerGroup().addTo(map);
  var hexLayer = L.layerGroup().addTo(map);
  var trackLine = L.polyline([],{color:'#334155',weight:4,opacity:.9}).addTo(map);
  var runner = null, userPanning = false, hexCache = {};
  var post = function(m){ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  map.on('dragstart', function(){ userPanning = true; post({type:'pan'}); });
  map.on('moveend', function(){ userPanning = false; });
  window.__apply = function(f){
    document.documentElement.style.setProperty('--accent', f.accent);
    fogLayer.clearLayers();
    for (var i=0;i<f.fog.length;i++) fogLayer.addLayer(L.polygon(f.fog[i],{fillColor:'#ffffff',fillOpacity:.55,color:'#ffffff',opacity:.9,weight:1,interactive:false}));
    hexLayer.clearLayers();
    for (var j=0;j<f.hexes.length;j++){ var h=f.hexes[j]; hexLayer.addLayer(L.polygon(h.c,{fillColor:h.f,fillOpacity:.45,color:h.s,opacity:.95,weight:2,interactive:false})); }
    trackLine.setStyle({color:f.accent}); trackLine.setLatLngs(f.track);
    if (f.pos){
      if (!runner){ runner = L.marker(f.pos,{icon:L.divIcon({className:'',html:'<div class="runner"></div>',iconSize:[22,22],iconAnchor:[11,11]}),interactive:false}).addTo(map); }
      runner.setLatLng(f.pos); runner.setOpacity(f.runner?1:0);
      if (f.follow && !userPanning) map.setView(f.pos, Math.max(map.getZoom(),16), {animate:true, duration:.4});
    }
  };
  window.__center = function(lat,lng,zoom){ map.setView([lat,lng], zoom||16, {animate:true}); };
  post({type:'ready'});
})();
</script></body></html>`;

/**
 * OpenStreetMap-based map rendered with Leaflet inside a WebView. Works in
 * Expo Go on any phone with no API key. Hex geometry is computed in RN with
 * h3-js and streamed to the page as a compact JSON frame on every change.
 */
function LeafletMapComponent({
  territory,
  position,
  track,
  accent,
  follow,
  showRunner,
  initialCenter,
  onUserPan,
  onReady,
}: Props) {
  const webRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const html = useMemo(
    () =>
      HTML.replace('__LAT__', String(initialCenter.latitude)).replace(
        '__LNG__',
        String(initialCenter.longitude),
      ),
    [initialCenter.latitude, initialCenter.longitude],
  );

  const originCell = position ? cellFor(position) : null;
  const fog = useMemo(() => {
    if (!originCell) return [];
    return fogAroundCell(originCell)
      .filter((cell) => !territory[cell])
      .map((cell) => toPairs(boundaryFor(cell)));
  }, [originCell, territory]);

  const hexes = useMemo(
    () =>
      Object.entries(territory).map(([cell, owner]) => ({
        c: toPairs(boundaryFor(cell)),
        f: UNIVERSITIES[owner].neon,
        s: withAlpha(UNIVERSITIES[owner].neon, 0.95),
      })),
    [territory],
  );

  useEffect(() => {
    if (!ready) return;
    const frame: Frame = {
      fog,
      hexes,
      track: toPairs(track),
      pos: position ? [position.latitude, position.longitude] : null,
      accent,
      follow,
      runner: showRunner,
    };
    webRef.current?.injectJavaScript(`window.__apply(${JSON.stringify(frame)}); true;`);
  }, [ready, fog, hexes, track, position, accent, follow, showRunner]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <WebView
        ref={webRef}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://campusconquerors.local/' }}
        style={styles.web}
        javaScriptEnabled
        domStorageEnabled
        setBuiltInZoomControls={false}
        overScrollMode="never"
        onMessage={(e) => {
          try {
            const msg = JSON.parse(e.nativeEvent.data) as { type: string };
            if (msg.type === 'ready') {
              setReady(true);
              onReady?.();
            } else if (msg.type === 'pan') onUserPan?.();
          } catch {
            // ignore malformed messages
          }
        }}
      />
    </View>
  );
}

export const LeafletMap = memo(LeafletMapComponent);

const styles = StyleSheet.create({
  web: { flex: 1, backgroundColor: BASE.background },
});
