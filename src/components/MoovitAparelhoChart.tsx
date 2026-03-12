import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MoovitAparelhoRow } from '../services/api';
import { Filters } from '../types/campaign';

interface MoovitAparelhoChartProps {
  data: MoovitAparelhoRow[];
  filters: Filters;
}

// Ícones SVG para as marcas de aparelhos
const BrandIcon = ({ brand, size = 20 }: { brand: string; size?: number }) => {
  const b = brand.toLowerCase();

  if (b === 'apple') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>
    );
  }

  if (b === 'samsung') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
      </svg>
    );
  }

  if (b === 'xiaomi') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 6h4v12H3V6zm7 0h4c1.1 0 2 .9 2 2v8c0 1.1-.9 2-2 2h-4V6zm1 2v8h3V8h-3zm6-2h2v12h-2V6z"/>
      </svg>
    );
  }

  if (b === 'motorola') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
      </svg>
    );
  }

  // Ícone genérico de smartphone
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
    </svg>
  );
};

const BRAND_COLORS: Record<string, string> = {
  apple:    '#555555',
  samsung:  '#1428A0',
  xiaomi:   '#FF6900',
  motorola: '#E1000F',
  realme:   '#FFD200',
  oppo:     '#1D8348',
  infinix:  '#0055D4',
  lg:       '#A50034',
  google:   '#4285F4',
  huawei:   '#CF0A2C',
  asus:     '#00ADEF',
  tcl:      '#003087',
  android:  '#3DDC84',
};

const getBrandColor = (brand: string) =>
  BRAND_COLORS[brand.toLowerCase()] || '#94A3B8';

const MoovitAparelhoChart = ({ data, filters }: MoovitAparelhoChartProps) => {
  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (filters.dateRange.start) filtered = filtered.filter(d => d.date >= filters.dateRange.start!);
    if (filters.dateRange.end)   filtered = filtered.filter(d => d.date <= filters.dateRange.end!);
    return filtered;
  }, [data, filters.dateRange]);

  const chartData = useMemo(() => {
    const aggregated = new Map<string, number>();
    filteredData.forEach(row => {
      const key = row.aparelho || 'Outros';
      aggregated.set(key, (aggregated.get(key) || 0) + row.totalImpressions);
    });
    return Array.from(aggregated.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // top 8 marcas
  }, [filteredData]);

  const totalImpressions = chartData.reduce((sum, d) => sum + d.value, 0);

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) => {
    if (!active || !payload?.length) return null;
    const item = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow p-3 text-xs">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-gray-500" style={{ color: getBrandColor(item.name) }}>
            <BrandIcon brand={item.name} size={14} />
          </span>
          <span className="font-semibold text-gray-800">{item.name}</span>
        </div>
        <p className="text-gray-600">{item.value.toLocaleString('pt-BR')} impressões</p>
        <p className="text-gray-400">{totalImpressions > 0 ? ((item.value / totalImpressions) * 100).toFixed(1) : 0}% do total</p>
      </div>
    );
  };

  const CustomLabel = ({ x, y, width, value }: { x?: number; y?: number; width?: number; value?: number }) => {
    if (!value || !width || width < 40) return null;
    return (
      <text x={(x ?? 0) + (width ?? 0) / 2} y={(y ?? 0) - 4} fill="#6B7280" textAnchor="middle" fontSize={11}>
        {formatNumber(value)}
      </text>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        {/* Ícone de smartphone */}
        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Impressões por Aparelho</h3>
          <p className="text-xs text-gray-500 mt-0.5">Moovit — distribuição por marca de dispositivo</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Nenhum dado disponível
        </div>
      ) : (
        <>
          {/* Ícones de marca no topo */}
          <div className="flex flex-wrap gap-3 mb-4">
            {chartData.slice(0, 5).map(item => (
              <div
                key={item.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: getBrandColor(item.name) }}
              >
                <BrandIcon brand={item.name} size={13} />
                <span>{item.name}</span>
              </div>
            ))}
          </div>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 0 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: '#6B7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} label={<CustomLabel />}>
                {chartData.map((item) => (
                  <Cell key={item.name} fill={getBrandColor(item.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="mt-2 text-center text-xs text-gray-500">
            Total: <span className="font-semibold text-gray-700">{formatNumber(totalImpressions)} impressões</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MoovitAparelhoChart;
