import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import { MoovitDeviceRow } from '../services/api';
import { Filters } from '../types/campaign';

interface MoovitDeviceChartProps {
  data: MoovitDeviceRow[];
  filters: Filters;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

const DEVICE_LABELS: Record<string, string> = {
  'Android Phone (Google)': 'Android Phone',
  'iPhone / iPod Touch (Apple)': 'iPhone',
  'Android Tablet (Google)': 'Android Tablet',
  'iPad (Apple)': 'iPad',
};

const MoovitDeviceChart = ({ data, filters }: MoovitDeviceChartProps) => {
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
    const aggregated = new Map<string, number>();
    filteredData.forEach(row => {
      const label = DEVICE_LABELS[row.device] || row.device;
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
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-800">Impressões por Dispositivo</h3>
        <p className="text-xs text-gray-500 mt-0.5">Moovit — distribuição por tipo de dispositivo</p>
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

export default MoovitDeviceChart;
