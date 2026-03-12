import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { MoovitOperadoraRow } from '../services/api';
import { Filters } from '../types/campaign';

interface MoovitOperadoraChartProps {
  data: MoovitOperadoraRow[];
  filters: Filters;
}

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#EF4444'];

// Ícones SVG inline para as operadoras (baseados em cores das marcas)
const OPERADORA_CONFIG: Record<string, { label: string; color: string }> = {
  'Vivo in BR':  { label: 'Vivo',  color: '#8B5CF6' },
  'Claro in BR': { label: 'Claro', color: '#EC4899' },
  'TIM in BR':   { label: 'TIM',   color: '#3B82F6' },
  'Oi in BR':    { label: 'Oi',    color: '#F59E0B' },
};

const MoovitOperadoraChart = ({ data, filters }: MoovitOperadoraChartProps) => {
  const filteredData = useMemo(() => {
    let filtered = [...data];
    if (filters.dateRange.start) filtered = filtered.filter(d => d.date >= filters.dateRange.start!);
    if (filters.dateRange.end)   filtered = filtered.filter(d => d.date <= filters.dateRange.end!);
    return filtered;
  }, [data, filters.dateRange]);

  const chartData = useMemo(() => {
    const aggregated = new Map<string, number>();
    filteredData.forEach(row => {
      const label = OPERADORA_CONFIG[row.operadora]?.label || row.operadora;
      aggregated.set(label, (aggregated.get(label) || 0) + row.totalImpressions);
    });
    return Array.from(aggregated.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const totalImpressions = chartData.reduce((sum, d) => sum + d.value, 0);

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  const renderCustomLabel = (props: PieLabelRenderProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    if (!percent || percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const ir = typeof innerRadius === 'number' ? innerRadius : 0;
    const or = typeof outerRadius === 'number' ? outerRadius : 0;
    const ma = typeof midAngle === 'number' ? midAngle : 0;
    const cxN = typeof cx === 'number' ? cx : 0;
    const cyN = typeof cy === 'number' ? cy : 0;
    const radius = ir + (or - ir) * 0.5;
    const x = cxN + radius * Math.cos(-ma * RADIAN);
    const y = cyN + radius * Math.sin(-ma * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6">
      <div className="mb-4 flex items-center gap-2">
        {/* Ícone de antena/sinal */}
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <svg className="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Impressões por Operadora</h3>
          <p className="text-xs text-gray-500 mt-0.5">Moovit — distribuição por operadora de celular</p>
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Nenhum dado disponível
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                labelLine={false}
                label={renderCustomLabel}
              >
                {chartData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => [(value as number).toLocaleString('pt-BR'), 'Impressões']}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Legend
                formatter={(value) => <span className="text-xs text-gray-700">{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="mt-2 text-center text-xs text-gray-500">
            Total: <span className="font-semibold text-gray-700">{formatNumber(totalImpressions)} impressões</span>
          </div>
        </>
      )}
    </div>
  );
};

export default MoovitOperadoraChart;
