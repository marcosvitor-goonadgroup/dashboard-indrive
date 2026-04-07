import { useEffect, useRef, useMemo, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ProcessedCampaignData } from '../types/campaign';

interface MoovitMapChartProps {
  data: ProcessedCampaignData[];
  isFiltered: boolean;
}

// Mapeamento cidade → código IBGE do estado
const CITY_TO_STATE_IBGE: Record<string, string> = {
  'Campo Grande':   '50', // Mato Grosso do Sul
  'São Paulo':      '35', // São Paulo
  'Curitiba':       '41', // Paraná
  'Cuiabá':         '51', // Mato Grosso
  'Manaus':         '13', // Amazonas
  'Belém':          '15', // Pará
  'Porto Velho':    '11', // Rondônia
  'Rio Branco':     '12', // Acre
  'Macapá':         '16', // Amapá
  'Boa Vista':      '14', // Roraima
  'Palmas':         '17', // Tocantins
  'Rio de Janeiro': '33', // Rio de Janeiro
  'Belo Horizonte': '31', // Minas Gerais
  'Salvador':       '29', // Bahia
  'Fortaleza':      '23', // Ceará
  'Recife':         '26', // Pernambuco
  'Porto Alegre':   '43', // Rio Grande do Sul
  'Goiânia':        '52', // Goiás
  'Brasília':       '53', // Distrito Federal
};

// Mapeamento cidade → código IBGE do município (para zoom)
const CITY_IBGE: Record<string, string> = {
  'Campo Grande':   '5002704',
  'São Paulo':      '3550308',
  'Curitiba':       '4106902',
  'Cuiabá':         '5103403',
  'Manaus':         '1302603',
  'Belém':          '1501402',
  'Porto Velho':    '1100205',
  'Rio Branco':     '1200401',
  'Macapá':         '1600303',
  'Boa Vista':      '1400100',
  'Palmas':         '1721000',
  'Rio de Janeiro': '3304557',
  'Belo Horizonte': '3106200',
  'Salvador':       '2927408',
  'Fortaleza':      '2304400',
  'Recife':         '2611606',
  'Porto Alegre':   '4314902',
  'Goiânia':        '5208707',
  'Brasília':       '5300108',
};

// Cor por índice de cidade
const CITY_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Bounds do Brasil para view inicial
const BRAZIL_BOUNDS: L.LatLngBoundsLiteral = [[-33.75, -73.99], [5.27, -28.84]];

type MetricKey = 'impressions' | 'clicks';

const MoovitMapChart = ({ data, isFiltered }: MoovitMapChartProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const brazilLayerRef = useRef<L.GeoJSON | null>(null);
  const stateLayersRef = useRef<Map<string, L.GeoJSON>>(new Map());
  const [metric, setMetric] = useState<MetricKey>('impressions');
  const [brazilGeo, setBrazilGeo] = useState<GeoJSON.FeatureCollection | null>(null);
  const [stateGeoCache, setStateGeoCache] = useState<Map<string, GeoJSON.FeatureCollection>>(new Map());
  const [cityGeoCache, setCityGeoCache] = useState<Map<string, GeoJSON.FeatureCollection>>(new Map());
  const [loadingGeo, setLoadingGeo] = useState(true);

  // Agrega impressões e cliques por cidade
  const aggregated = useMemo(() => {
    const cityMap = new Map<string, { impressions: number; clicks: number }>();
    data.forEach(row => {
      const city = row.city?.trim();
      if (!city) return;
      const existing = cityMap.get(city) || { impressions: 0, clicks: 0 };
      cityMap.set(city, {
        impressions: existing.impressions + row.impressions,
        clicks: existing.clicks + row.clicks,
      });
    });
    return cityMap;
  }, [data]);

  const cities = useMemo(() => Array.from(aggregated.keys()), [aggregated]);

  const totals = useMemo(() => {
    let impressions = 0;
    let clicks = 0;
    aggregated.forEach(v => { impressions += v.impressions; clicks += v.clicks; });
    return { impressions, clicks };
  }, [aggregated]);

  // Estados únicos das cidades ativas
  const activeStateIds = useMemo(
    () => Array.from(new Set(cities.map(c => CITY_TO_STATE_IBGE[c]).filter(Boolean))),
    [cities]
  );

  // Busca GeoJSON do Brasil (estados) — uma vez
  useEffect(() => {
    fetch('https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&qualidade=intermediaria&divisao=estado')
      .then(r => r.json())
      .then(geo => setBrazilGeo(geo))
      .catch(() => setLoadingGeo(false));
  }, []);

  // Busca GeoJSON dos estados ativos
  useEffect(() => {
    if (activeStateIds.length === 0) return;
    const missing = activeStateIds.filter(id => !stateGeoCache.has(id));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(id =>
        fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/estados/${id}?formato=application/vnd.geo+json&qualidade=intermediaria`)
          .then(r => r.json())
          .then(geo => ({ id, geo }))
          .catch(() => null)
      )
    ).then(results => {
      setStateGeoCache(prev => {
        const next = new Map(prev);
        results.forEach(r => { if (r) next.set(r.id, r.geo); });
        return next;
      });
    });
  }, [activeStateIds]); // eslint-disable-line react-hooks/exhaustive-deps

  // Busca GeoJSON dos municípios (para modo filtrado e zoom)
  useEffect(() => {
    if (cities.length === 0) return;
    const missing = cities.filter(c => CITY_IBGE[c] && !cityGeoCache.has(c));
    if (missing.length === 0) return;

    Promise.all(
      missing.map(city =>
        fetch(`https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${CITY_IBGE[city]}?formato=application/vnd.geo+json&qualidade=intermediaria`)
          .then(r => r.json())
          .then(geo => ({ city, geo }))
          .catch(() => null)
      )
    ).then(results => {
      setCityGeoCache(prev => {
        const next = new Map(prev);
        results.forEach(r => { if (r) next.set(r.city, r.geo); });
        return next;
      });
    });
  }, [cities]); // eslint-disable-line react-hooks/exhaustive-deps

  // Loading: pronto quando Brasil + estados ativos estiverem carregados
  useEffect(() => {
    if (!brazilGeo) return;
    const allStatesReady = activeStateIds.every(id => stateGeoCache.has(id));
    if (allStatesReady) setLoadingGeo(false);
  }, [brazilGeo, stateGeoCache, activeStateIds]);

  // Inicializa mapa
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      zoomControl: true,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
    }).addTo(map);

    map.fitBounds(BRAZIL_BOUNDS, { padding: [10, 10] });
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Camada base do Brasil — adicionada uma vez
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !brazilGeo || brazilLayerRef.current) return;

    brazilLayerRef.current = L.geoJSON(brazilGeo as never, {
      style: () => ({
        fillColor: '#e2e8f0',
        fillOpacity: 0.5,
        color: '#94a3b8',
        weight: 1,
        opacity: 0.8,
      }),
      interactive: false,
    }).addTo(map);
  }, [brazilGeo]);

  // Camadas das cidades/estados — usa município quando filtrado, estado quando visão geral
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    stateLayersRef.current.forEach(layer => layer.remove());
    stateLayersRef.current.clear();

    cities.forEach((city, idx) => {
      // Escolhe o GeoJSON certo: município quando filtrado, estado quando visão geral
      let geo: GeoJSON.FeatureCollection | undefined;
      if (isFiltered) {
        geo = cityGeoCache.get(city);
      } else {
        const stateId = CITY_TO_STATE_IBGE[city];
        geo = stateId ? stateGeoCache.get(stateId) : undefined;
      }
      if (!geo) return;

      const color = CITY_COLORS[idx % CITY_COLORS.length];
      const cityData = aggregated.get(city);
      const impressions = cityData?.impressions ?? 0;
      const clicks = cityData?.clicks ?? 0;
      const value = metric === 'impressions' ? impressions : clicks;

      const layer = L.geoJSON(geo as never, {
        style: () => ({
          fillColor: color,
          fillOpacity: 0.55,
          color: color,
          weight: 2,
          opacity: 0.9,
        }),
        onEachFeature: (_, leafletLayer) => {
          leafletLayer.bindTooltip(
            `<div style="font-size:13px;font-weight:600;color:#1e293b">${city}</div>
             <div style="font-size:12px;color:#475569;margin-top:2px">
               Impressões: <strong>${impressions.toLocaleString('pt-BR')}</strong>
             </div>
             <div style="font-size:12px;color:#475569">
               Cliques: <strong>${clicks.toLocaleString('pt-BR')}</strong>
             </div>`,
            { sticky: true, className: 'leaflet-custom-tooltip' }
          );
          leafletLayer.on('mouseover', () => {
            (leafletLayer as L.Path).setStyle({ fillOpacity: 0.8, weight: 3 });
          });
          leafletLayer.on('mouseout', () => {
            (leafletLayer as L.Path).setStyle({ fillOpacity: 0.55, weight: 2 });
          });
        }
      }).addTo(map);

      stateLayersRef.current.set(city, layer);

      // Label do valor sobre o polígono
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        const center = bounds.getCenter();
        L.marker(center, {
          icon: L.divIcon({
            className: '',
            html: `<div style="
              background:${color};
              color:#fff;
              font-size:11px;
              font-weight:700;
              padding:2px 7px;
              border-radius:12px;
              white-space:nowrap;
              box-shadow:0 1px 4px rgba(0,0,0,0.18);
              pointer-events:none;
            ">${value >= 1_000_000 ? `${(value / 1_000_000).toFixed(1)}M` : value >= 1_000 ? `${(value / 1_000).toFixed(0)}k` : value}</div>`,
            iconAnchor: [0, 0],
          }),
          interactive: false,
        }).addTo(map);
      }
    });
  }, [stateGeoCache, cityGeoCache, aggregated, metric, cities, isFiltered]);

  // Zoom nas cidades quando filtro de campanha/PI estiver ativo
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!isFiltered || cities.length === 0) {
      // Volta para view Brasil
      map.flyToBounds(BRAZIL_BOUNDS, { padding: [10, 10], duration: 0.8 });
      return;
    }

    // Tenta usar GeoJSON dos municípios para zoom preciso
    const cityGeos = cities
      .map(city => cityGeoCache.get(city))
      .filter(Boolean) as GeoJSON.FeatureCollection[];

    if (cityGeos.length > 0) {
      const tempLayers = cityGeos.map(geo => L.geoJSON(geo as never));
      const allBounds = tempLayers
        .map(l => l.getBounds())
        .filter(b => b.isValid());

      if (allBounds.length > 0) {
        const combined = allBounds.reduce((acc, b) => acc.extend(b), allBounds[0]);
        map.flyToBounds(combined, { padding: [80, 80], maxZoom: 10, duration: 0.8 });
        return;
      }
    }

    // Fallback: usa bounds dos estados
    const stateBounds: L.LatLngBounds[] = [];
    cities.forEach(city => {
      const layer = stateLayersRef.current.get(city);
      if (layer) {
        const b = layer.getBounds();
        if (b.isValid()) stateBounds.push(b);
      }
    });
    if (stateBounds.length > 0) {
      const combined = stateBounds.reduce((acc, b) => acc.extend(b), stateBounds[0]);
      map.flyToBounds(combined, { padding: [60, 60], duration: 0.8 });
    }
  }, [isFiltered, cities, stateGeoCache, cityGeoCache]); // eslint-disable-line react-hooks/exhaustive-deps

  const formatNumber = (n: number) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M`
    : n >= 1_000 ? `${(n / 1_000).toFixed(1)}k`
    : n.toString();

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
            <p className="text-xs text-gray-500 mt-0.5">Impressões e cliques por cidade</p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMetric('impressions')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              metric === 'impressions' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Impressões
          </button>
          <button
            onClick={() => setMetric('clicks')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              metric === 'clicks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cliques
          </button>
        </div>
      </div>

      {/* Stats por cidade */}
      {cities.length > 0 && (
        <div className={`grid gap-3 mb-4 ${
          cities.length === 1 ? 'grid-cols-1' :
          cities.length === 2 ? 'grid-cols-2' :
          'grid-cols-3'
        }`}>
          {cities.map((city, idx) => {
            const cityData = aggregated.get(city);
            const color = CITY_COLORS[idx % CITY_COLORS.length];
            return (
              <div key={city} className="rounded-lg px-4 py-3" style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}>
                <p className="text-xs font-semibold mb-2" style={{ color }}>{city}</p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Impressões</p>
                    <p className="text-sm font-bold text-gray-800">{formatNumber(cityData?.impressions ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Cliques</p>
                    <p className="text-sm font-bold text-gray-800">{formatNumber(cityData?.clicks ?? 0)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mapa */}
      <div className="relative rounded-lg overflow-hidden" style={{ height: 420 }}>
        {loadingGeo && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50">
            <div className="text-sm text-gray-400">Carregando mapa...</div>
          </div>
        )}
        <div ref={mapRef} className="w-full h-full" />
      </div>

      {/* Legenda */}
      <div className="mt-3 flex items-center justify-between flex-wrap gap-2 text-xs text-gray-500">
        <div className="flex items-center gap-3 flex-wrap">
          {cities.map((city, idx) => (
            <div key={city} className="flex items-center gap-1.5">
              <span
                className="inline-block w-3 h-3 rounded-sm"
                style={{ backgroundColor: CITY_COLORS[idx % CITY_COLORS.length], opacity: 0.75 }}
              />
              <span>{city}</span>
            </div>
          ))}
        </div>
        <span>
          Total {metric === 'impressions' ? 'Impressões' : 'Cliques'}:{' '}
          <strong className="text-gray-700">
            {formatNumber(metric === 'impressions' ? totals.impressions : totals.clicks)}
          </strong>
        </span>
      </div>
    </div>
  );
};

export default MoovitMapChart;
