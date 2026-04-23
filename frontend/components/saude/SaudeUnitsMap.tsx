'use client';

import 'leaflet/dist/leaflet.css';

import { useEffect, useMemo, useState } from 'react';
import { useMap, MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { divIcon, type LatLngExpression } from 'leaflet';
import { useQuery } from '@tanstack/react-query';

import { formatScheduleSummary } from '@/lib/saude-utils';
import { saudeService } from '@/services/saude-service';
import type { SaudeUnitRecord } from '@/types/saude';

interface SaudeUnitsMapProps {
  units: SaudeUnitRecord[];
  selectedUnitId: number | null;
  onSelectUnit: (unitId: number) => void;
}

const DEFAULT_CENTER: LatLngExpression = [-19.9174, -54.3667];

const markerIcon = divIcon({
  className: 'saude-map-marker',
  html: `
    <div style="display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:999px;background:#0f4c81;color:#fff;border:3px solid rgba(255,255,255,0.9);box-shadow:0 12px 24px rgba(15,76,129,0.28);">
      <span class="material-symbols-outlined" style="font-size:18px;line-height:1;">local_hospital</span>
    </div>
  `,
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -18],
});

function MapCenterController({ center }: { center: LatLngExpression }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo(center, 14, { duration: 0.7 });
  }, [center, map]);

  return null;
}

function UserLocationButton() {
  const map = useMap();
  const [isLocating, setIsLocating] = useState(false);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        map.flyTo([position.coords.latitude, position.coords.longitude], 14, { duration: 0.7 });
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <button
      type="button"
      onClick={handleLocate}
      className="absolute right-4 top-4 z-[500] rounded-xl bg-surface-container-lowest px-3 py-2 text-xs font-semibold text-primary shadow-ambient"
    >
      {isLocating ? 'Localizando...' : 'Usar minha localização'}
    </button>
  );
}

function UnitPopup({ unit }: { unit: SaudeUnitRecord }) {
  const [isOpen, setIsOpen] = useState(false);
  const scheduleQuery = useQuery({
    queryKey: ['saude', 'unit-schedules', unit.id],
    queryFn: () => saudeService.getUnitSchedules(unit.id),
    enabled: isOpen,
  });

  return (
    <Marker
      position={[unit.latitude ?? 0, unit.longitude ?? 0]}
      icon={markerIcon}
      eventHandlers={{
        popupopen: () => setIsOpen(true),
        popupclose: () => setIsOpen(false),
      }}
    >
      <Popup>
        <div className="min-w-[240px] space-y-2 text-sm text-slate-800">
          <div>
            <p className="font-bold text-slate-900">{unit.name}</p>
            <p>{unit.unit_type}</p>
          </div>
          <div className="space-y-1 text-xs text-slate-600">
            <p>{unit.address}</p>
            {unit.neighborhood ? <p>{unit.neighborhood}</p> : null}
            {unit.phone ? <p>{unit.phone}</p> : null}
          </div>
          <div className="space-y-1 border-t border-slate-200 pt-2 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">Horários</p>
            {scheduleQuery.isLoading ? <p>Carregando horários...</p> : null}
            {scheduleQuery.error instanceof Error ? <p>{scheduleQuery.error.message}</p> : null}
            {scheduleQuery.data?.schedules.length ? (
              scheduleQuery.data.schedules.map((schedule) => (
                <p key={`${unit.id}-${schedule.day_of_week}`}>{formatScheduleSummary(schedule)}</p>
              ))
            ) : null}
            {scheduleQuery.data && scheduleQuery.data.schedules.length === 0 ? <p>Horários não cadastrados.</p> : null}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

export default function SaudeUnitsMap({ units, selectedUnitId, onSelectUnit }: SaudeUnitsMapProps) {
  const unitsWithCoordinates = useMemo(
    () => units.filter((unit) => unit.latitude !== null && unit.longitude !== null),
    [units]
  );

  const selectedUnit = useMemo(
    () => units.find((unit) => unit.id === selectedUnitId) ?? null,
    [selectedUnitId, units]
  );

  const center = useMemo<LatLngExpression>(() => {
    if (selectedUnit && selectedUnit.latitude !== null && selectedUnit.longitude !== null) {
      return [selectedUnit.latitude, selectedUnit.longitude];
    }

    if (unitsWithCoordinates[0]?.latitude !== null && unitsWithCoordinates[0]?.longitude !== null) {
      return [unitsWithCoordinates[0].latitude, unitsWithCoordinates[0].longitude];
    }

    return DEFAULT_CENTER;
  }, [selectedUnit, unitsWithCoordinates]);

  return (
    <div className="overflow-hidden rounded-3xl border border-outline/10 bg-surface-container-lowest shadow-ambient">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.6fr)_360px]">
        <div className="relative h-[480px]">
          <MapContainer center={center} zoom={13} className="h-full w-full" scrollWheelZoom>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapCenterController center={center} />
            <UserLocationButton />
            {unitsWithCoordinates.map((unit) => (
              <UnitPopup key={unit.id} unit={unit} />
            ))}
          </MapContainer>
        </div>

        <div className="max-h-[480px] space-y-3 overflow-y-auto border-t border-outline/10 p-4 lg:border-l lg:border-t-0">
          {units.map((unit) => {
            const isActive = unit.id === selectedUnitId;

            return (
              <button
                key={unit.id}
                type="button"
                onClick={() => onSelectUnit(unit.id)}
                className={`w-full rounded-2xl border p-4 text-left transition ${
                  isActive
                    ? 'border-primary bg-primary/5 shadow-ambient'
                    : 'border-outline/10 bg-surface-container-low hover:border-primary/30'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-headline text-base font-bold text-primary">{unit.name}</p>
                    <p className="mt-1 text-sm text-on-surface-variant">{unit.unit_type}</p>
                  </div>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[11px] font-semibold text-secondary">
                    {unit.is_active ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
                <div className="mt-3 space-y-1 text-sm text-on-surface-variant">
                  <p>{unit.address}</p>
                  {unit.neighborhood ? <p>{unit.neighborhood}</p> : null}
                  {unit.phone ? <p>{unit.phone}</p> : null}
                  {unit.latitude === null || unit.longitude === null ? (
                    <p className="text-tertiary">Localização indisponível no mapa.</p>
                  ) : null}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
