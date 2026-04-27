'use client';

import 'leaflet/dist/leaflet.css';

import { useMemo, useState } from 'react';
import { divIcon, type LatLngExpression } from 'leaflet';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

import type { ObraLocation } from '@/types/obra';

interface ObraLocationMapProps {
  locations: ObraLocation[];
}

type MapType = 'standard' | 'satellite';

const DEFAULT_CENTER: LatLngExpression = [-19.9174, -54.3667];

const TILES: Record<MapType, { url: string; attribution: string }> = {
  standard: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
  },
};

function createMarkerIcon(sequencia: number, color: string) {
  return divIcon({
    className: 'obra-map-marker',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:999px;background:${color};color:#fff;border:2.5px solid rgba(255,255,255,0.92);box-shadow:0 8px 20px rgba(0,25,60,0.22);font-weight:700;font-size:13px;font-family:var(--font-inter),system-ui,sans-serif;">
        ${sequencia}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

export default function ObraLocationMap({ locations }: ObraLocationMapProps) {
  const [mapType, setMapType] = useState<MapType>('standard');

  const mappedLocations = useMemo(() => {
    return locations.filter(
      (loc): loc is ObraLocation & { latitude: number; longitude: number } =>
        loc.latitude !== null && loc.longitude !== null,
    );
  }, [locations]);

  const center: LatLngExpression = useMemo(() => {
    if (mappedLocations.length > 0) {
      return [mappedLocations[0].latitude, mappedLocations[0].longitude];
    }
    return DEFAULT_CENTER;
  }, [mappedLocations]);

  if (process.env.NODE_ENV === 'test') {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-6">
        <h2 className="font-headline text-xl font-bold text-primary">Localização</h2>
        <div className="mt-4 flex h-[320px] items-center justify-center rounded-2xl bg-surface-container-low text-sm text-on-surface-variant">
          Mapa disponível no navegador
        </div>
      </div>
    );
  }

  if (mappedLocations.length === 0) {
    return (
      <div className="rounded-3xl bg-surface-container-lowest p-6">
        <h2 className="font-headline text-xl font-bold text-primary">Localização</h2>
        <div className="mt-4 flex h-[320px] items-center justify-center rounded-2xl bg-surface-container-low text-sm text-on-surface-variant">
          Localização não disponível
        </div>
      </div>
    );
  }

  const tile = TILES[mapType];

  return (
    <div className="rounded-3xl bg-surface-container-lowest p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-headline text-xl font-bold text-primary">Localização</h2>
        <div className="inline-flex overflow-hidden rounded-xl bg-surface-container-low">
          <button
            type="button"
            onClick={() => setMapType('standard')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mapType === 'standard'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Padrão
          </button>
          <button
            type="button"
            onClick={() => setMapType('satellite')}
            className={`px-3 py-1.5 text-sm font-medium transition-colors ${
              mapType === 'satellite'
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Satélite
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl">
        <MapContainer center={center} zoom={13} className="h-[320px] w-full" scrollWheelZoom>
          <TileLayer attribution={tile.attribution} url={tile.url} />
          {mappedLocations.map((loc, index) => (
            <Marker
              key={loc.id ?? `loc-${loc.sequencia}`}
              position={[loc.latitude, loc.longitude]}
              icon={createMarkerIcon(
                loc.sequencia,
                index % 2 === 0 ? '#00193c' : '#006c47',
              )}
            >
              <Popup>
                <div className="font-body text-sm text-on-surface">
                  <p className="font-medium">{loc.logradouro}</p>
                  <p className="text-on-surface-variant">
                    {loc.numero && `Nº ${loc.numero}`}
                    {loc.numero && loc.bairro ? ' — ' : ''}
                    {loc.bairro}
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
