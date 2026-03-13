import { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { MoovitGeneroRow } from '../services/api';

interface Props {
  data: MoovitGeneroRow[];
}

const COLORS: Record<string, string> = {
  Feminino: '#EC4899',
  Masculino: '#6366F1',
};

const GenderIcon = ({ gender }: { gender: string }) => {
  if (gender === 'Feminino') {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <path d="M11 14.93V17H13V14.93C15.28 14.43 17 12.41 17 10C17 7.24 14.76 5 12 5C9.24 5 7 7.24 7 10C7 12.41 8.72 14.43 11 14.93ZM12 7C13.65 7 15 8.35 15 10C15 11.65 13.65 13 12 13C10.35 13 9 11.65 9 10C9 8.35 10.35 7 12 7ZM13 18H15V20H13V18ZM9 18H11V20H9V18Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M14 2V4H17.59L13.76 7.83C12.96 7.31 12 7 11 7C8.24 7 6 9.24 6 12C6 14.76 8.24 17 11 17C13.76 17 16 14.76 16 12C16 11 15.69 10.04 15.17 9.24L19 5.41V9H21V2H14ZM11 15C9.35 15 8 13.65 8 12C8 10.35 9.35 9 11 9C12.65 9 14 10.35 14 12C14 13.65 12.65 15 11 15Z" />
    </svg>
  );
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percent: number } }> }) => {
  if (active && payload && payload.length) {
    const { name, value, payload: p } = payload[0];
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-gray-800">{name}</p>
        <p className="text-gray-600">{value.toLocaleString('pt-BR')} impressões</p>
        <p className="text-gray-500">{(p.percent * 100).toFixed(1)}%</p>
      </div>
    );
  }
  return null;
};

const MoovitGeneroChart = ({ data }: Props) => {
  const total = useMemo(() => data.reduce((s, r) => s + r.impressoes, 0), [data]);

  const chartData = useMemo(
    () => data.map(r => ({ name: r.genero, value: r.impressoes, percent: total > 0 ? r.impressoes / total : 0 })),
    [data, total]
  );

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('pt-BR');

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-pink-100 flex items-center justify-center text-pink-500">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M11.5 2C9.01 2 7 4.01 7 6.5S9.01 11 11.5 11 16 8.99 16 6.5 13.99 2 11.5 2zm0 2c1.38 0 2.5 1.12 2.5 2.5S12.88 9 11.5 9 9 7.88 9 6.5 10.12 4 11.5 4zM11.5 12C8.33 12 2 13.58 2 16.75V19h19v-2.25C21 13.58 14.67 12 11.5 12zm0 2c3.53 0 7.27 1.76 7.5 2.75H4c.23-.99 3.97-2.75 7.5-2.75z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Gênero</h3>
          <p className="text-xs text-gray-500 mt-0.5">Distribuição de impressões</p>
        </div>
      </div>

      {/* Gráfico rosca */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full" style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cards por gênero */}
        <div className="grid grid-cols-2 gap-3 w-full mt-2">
          {chartData.map(entry => {
            const color = COLORS[entry.name] ?? '#94a3b8';
            return (
              <div
                key={entry.name}
                className="rounded-xl px-4 py-3 flex flex-col gap-1"
                style={{ backgroundColor: `${color}15`, border: `1px solid ${color}30` }}
              >
                <div className="flex items-center gap-2" style={{ color }}>
                  <GenderIcon gender={entry.name} />
                  <span className="text-xs font-semibold">{entry.name}</span>
                </div>
                <p className="text-lg font-bold" style={{ color }}>{formatNumber(entry.value)}</p>
                <p className="text-xs font-medium" style={{ color: `${color}99` }}>
                  {(entry.percent * 100).toFixed(1)}%
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MoovitGeneroChart;
