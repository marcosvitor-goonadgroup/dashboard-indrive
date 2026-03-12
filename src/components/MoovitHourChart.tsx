import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { MoovitHourRow } from '../services/api';
import { Filters } from '../types/campaign';

interface MoovitHourChartProps {
  data: MoovitHourRow[];
  filters: Filters;
}

const formatHour = (hour: number) => {
  const h = hour.toString().padStart(2, '0');
  return `${h}h`;
};

const MoovitHourChart = ({ data, filters }: MoovitHourChartProps) => {
  const filteredData = useMemo(() => {
    let filtered = [...data];

    if (filters.dateRange.start) {
      filtered = filtered.filter(d => d.date >= filters.dateRange.start!);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(d => d.date <= filters.dateRange.end!);
    }

    return filtered;
  }, [data, filters.dateRange]);

  const chartData = useMemo(() => {
    const aggregated = new Map<number, number>();
    for (let h = 0; h < 24; h++) aggregated.set(h, 0);

    filteredData.forEach(row => {
      aggregated.set(row.hour, (aggregated.get(row.hour) || 0) + row.totalImpressions);
    });

    return Array.from(aggregated.entries())
      .map(([hour, value]) => ({ hour, label: formatHour(hour), value }))
      .sort((a, b) => a.hour - b.hour);
  }, [filteredData]);

  const maxValue = Math.max(...chartData.map(d => d.value));

  const formatYAxis = (value: number) =>
    value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value.toString();

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">Pico de Impressões por Hora</h3>
        <p className="text-xs text-gray-500 mt-0.5">Moovit — distribuição de impressões ao longo do dia</p>
      </div>

      {chartData.every(d => d.value === 0) ? (
        <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
          Nenhum dado disponível
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: '#6B7280' }}
              interval={1}
              angle={-45}
              textAnchor="end"
              height={40}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: '#6B7280' }}
              width={40}
            />
            <Tooltip
              formatter={(value) => [(value as number).toLocaleString('pt-BR'), 'Impressões']}
              labelFormatter={(label) => `Horário: ${label}`}
              contentStyle={{ borderRadius: 8, fontSize: 12 }}
            />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={index}
                  fill={entry.value === maxValue ? '#4F46E5' : '#A5B4FC'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default MoovitHourChart;
