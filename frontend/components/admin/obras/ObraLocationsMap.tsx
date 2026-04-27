'use client';

import 'leaflet/dist/leaflet.css';

import { divIcon, type LatLngExpression } from 'leaflet';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

import type { ObraLocation } from '@/types/obra';

interface ObraLocationsMapProps {
  locations: ObraLocation[];
  activeLocationIndex: number;
  onPickCoordinates: (index: number, latitude: number, longitude: number) => void;
}

const DEFAULT_CENTER: LatLngExpression = [-19.9174, -54.3667];

type MappedLocation = ObraLocation & {
  index: number;
  latitude: number;
  longitude: number;
};

function createMarkerIcon(index: number, active: boolean) {
  return divIcon({
    className: 'obra-map-marker',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:999px;background:${active ? '#0f4c81' : '#22c55e'};color:#fff;border:3px solid rgba(255,255,255,0.92);box-shadow:0 12px 24px rgba(15,76,129,0.24);font-weight:700;">
        ${index + 1}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

function MapClickController({
  activeLocationIndex,
  onPickCoordinates,
}: {
  activeLocationIndex: number;
  onPickCoordinates: (index: number, latitude: number, longitude: number) => void;
}) {
  useMapEvents({
    click(event) {
      onPickCoordinates(activeLocationIndex, event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export default function ObraLocationsMap({
  locations,
  activeLocationIndex,
  onPickCoordinates,
}: ObraLocationsMapProps) {
  if (process.env.NODE_ENV === 'test') {
    return (
      <div className="rounded-2xl border border-dashed border-outline/20 bg-surface-container-lowest p-4 text-sm text-on-surface-variant">
        Mapa interativo disponível no navegador. Clique no mapa para posicionar o pin do local selecionado.
      </div>
    );
  }

  const mappedLocations = locations.reduce<MappedLocation[]>((accumulator, location, index) => {
    if (location.latitude === null || location.longitude === null) {
      return accumulator;
    }
    accumulator.push({ ...location, index, latitude: location.latitude, longitude: location.longitude });
    return accumulator;
  }, []);

  const center = mappedLocations[activeLocationIndex]
    ? ([mappedLocations[activeLocationIndex].latitude, mappedLocations[activeLocationIndex].longitude] satisfies LatLngExpression)
    : mappedLocations[0]
      ? ([mappedLocations[0].latitude, mappedLocations[0].longitude] satisfies LatLngExpression)
      : DEFAULT_CENTER;

  return (
    <div className="overflow-hidden rounded-2xl border border-outline/10">
      <MapContainer center={center} zoom={13} className="h-[320px] w-full" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickController activeLocationIndex={activeLocationIndex} onPickCoordinates={onPickCoordinates} />
        {mappedLocations.map((location) => (
          <Marker
            key={location.id ?? `${location.sequencia}-${location.index}`}
            position={[location.latitude ?? 0, location.longitude ?? 0]}
            icon={createMarkerIcon(location.index, location.index === activeLocationIndex)}
          />
        ))}
      </MapContainer>
    </div>
  );
}
