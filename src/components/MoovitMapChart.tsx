import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MoovitMapaRow } from '../services/api';
import { Filters } from '../types/campaign';

interface MoovitMapChartProps {
  data: MoovitMapaRow[];
  filters: Filters;
}

// Código IBGE de Campo Grande - MS
const IBGE_CITY_CODE = '5002704';

// Cor base do highlight do mapa
const MAP_COLOR = '#4F46E5';

type MetricKey = 'impressions' | 'clicks';

const MoovitMapChart = ({ data, filters }: MoovitMapChartProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geoLayerRef = useRef<L.GeoJSON | null>(null);
  const [metric, setMetric] = useState<MetricKey>('impressions');
  const [geoData, setGeoData] = useState<GeoJSON.FeatureCollection | null>(null);
  const [loadingGeo, setLoadingGeo] = useState(true);

  // Agrega dados pelo filtro de datas
  const aggregated = useMemo(() => {
    let filtered = [...data];
    if (filters.dateRange.start) filtered = filtered.filter(d => d.date >= filters.dateRange.start!);
    if (filters.dateRange.end)   filtered = filtered.filter(d => d.date <= filters.dateRange.end!);

    const cityMap = new Map<string, { impressions: number; clicks: number }>();
    filtered.forEach(row => {
      const existing = cityMap.get(row.city) || { impressions: 0, clicks: 0 };
      cityMap.set(row.city, {
        impressions: existing.impressions + row.totalImpressions,
        clicks: existing.clicks + row.totalClicks
      });
    });
    return cityMap;
  }, [data, filters.dateRange]);

  const totalValue = useMemo(() => {
    let total = 0;
    aggregated.forEach(v => { total += metric === 'impressions' ? v.impressions : v.clicks; });
    return total;
  }, [aggregated, metric]);

  // Busca GeoJSON do município via IBGE API
  useEffect(() => {
    setLoadingGeo(true);
    fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${IBGE_CITY_CODE}?formato=application/vnd.geo+json&qualidade=intermediaria`)
      .then(r => r.json())
      .then(geo => {
        setGeoData(geo);
        setLoadingGeo(false);
      })
      .catch(() => setLoadingGeo(false));
  }, []);

  // Inicializa mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    // Tile layer neutro/claro
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Atualiza camada GeoJSON quando dados ou métrica mudam
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoData) return;

    if (geoLayerRef.current) {
      geoLayerRef.current.remove();
      geoLayerRef.current = null;
    }

    const layer = L.geoJSON(geoData as never, {
      style: () => ({
        fillColor: MAP_COLOR,
        fillOpacity: 0.45,
        color: MAP_COLOR,
        weight: 2,
        opacity: 0.9,
      }),
      onEachFeature: (_, leafletLayer) => {
        // Campo Grande (única cidade)
        const cityData = aggregated.get('Campo Grande');
        const value = cityData
          ? metric === 'impressions' ? cityData.impressions : cityData.clicks
          : 0;

        leafletLayer.bindTooltip(
          `<div style="font-size:13px; font-weight:600; color:#1e293b">Campo Grande</div>
           <div style="font-size:12px; color:#475569">${metric === 'impressions' ? 'Impressões' : 'Cliques'}: <strong>${value.toLocaleString('pt-BR')}</strong></div>`,
          { sticky: true, className: 'leaflet-custom-tooltip' }
        );

        leafletLayer.on('mouseover', () => {
          (leafletLayer as L.Path).setStyle({ fillOpacity: 0.7, weight: 3 });
        });
        leafletLayer.on('mouseout', () => {
          (leafletLayer as L.Path).setStyle({ fillOpacity: 0.45, weight: 2 });
        });
      }
    }).addTo(map);

    geoLayerRef.current = layer;

    // Centraliza no polígono
    const bounds = layer.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [geoData, aggregated, metric]);

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const cityData = aggregated.get('Campo Grande');

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
            <svg className="w-4 h-4 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-800">Distribuição Geográfica</h3>
            <p className="text-xs text-gray-500 mt-0.5">Moovit — impressões e cliques por cidade</p>
          </div>
        </div>

        {/* Toggle métrica */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMetric('impressions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              metric === 'impressions'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Impressões
          </button>
          <button
            onClick={() => setMetric('clicks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              metric === 'clicks'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cliques
          </button>
        </div>
      </div>

      {/* Stats rápidos */}
      {cityData && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-indigo-50 rounded-lg px-4 py-3">
            <p className="text-xs text-indigo-500 mb-0.5">Total Impressões</p>
            <p className="text-lg font-bold text-indigo-700">{formatNumber(cityData.impressions)}</p>
          </div>
          <div className="bg-purple-50 rounded-lg px-4 py-3">
            <p className="text-xs text-purple-500 mb-0.5">Total Cliques</p>
            <p className="text-lg font-bold text-purple-700">{formatNumber(cityData.clicks)}</p>
          </div>
        </div>
      )}

      {/* Mapa */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: 360 }}>
        {loadingGeo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="text-sm text-gray-400">Carregando mapa...</div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Legenda */}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-4 h-4 rounded"
            style={{ backgroundColor: MAP_COLOR, opacity: 0.55 }}
          />
          <span>Campo Grande — {metric === 'impressions' ? 'Impressões' : 'Cliques'}</span>
        </div>
        <span>Total: <strong className="text-gray-700">{formatNumber(totalValue)}</strong></span>
      </div>
    </div>
  );
};

export default MoovitMapChart;
