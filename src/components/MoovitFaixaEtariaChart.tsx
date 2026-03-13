import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MoovitFaixaEtariaRow } from '../services/api';

interface Props {
  data: MoovitFaixaEtariaRow[];
}

// Gradiente de cores por faixa: jovem → maduro
const FAIXA_COLORS: Record<string, string> = {
  '18-24': '#818CF8',
  '25-34': '#6366F1',
  '35-54': '#4F46E5',
  '55+':   '#3730A3',
};

const DEFAULT_COLOR = '#6366F1';

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-xs">
        <p className="font-semibold text-gray-800 mb-1">Faixa {label}</p>
        <p className="text-gray-600">{payload[0].value.toLocaleString('pt-BR')} impressões</p>
      </div>
    );
  }
  return null;
};

const MoovitFaixaEtariaChart = ({ data }: Props) => {
  const total = useMemo(() => data.reduce((s, r) => s + r.impressoes, 0), [data]);

  const chartData = useMemo(
    () => data.map(r => ({ name: r.faixa, value: r.impressoes, pct: total > 0 ? (r.impressoes / total) * 100 : 0 })),
    [data, total]
  );

  const maxValue = useMemo(() => Math.max(...chartData.map(d => d.value), 1), [chartData]);

  const formatNumber = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toLocaleString('pt-BR');

  return (
    <div className="bg-white/60 backdrop-blur-md rounded-xl shadow-md border border-gray-200/50 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-500">
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-800">Faixa Etária</h3>
          <p className="text-xs text-gray-500 mt-0.5">Distribuição de impressões por idade</p>
        </div>
      </div>

      {/* Barras horizontais customizadas */}
      <div className="flex-1 flex flex-col gap-3">
        {chartData.map(entry => {
          const color = FAIXA_COLORS[entry.name] ?? DEFAULT_COLOR;
          const barPct = maxValue > 0 ? (entry.value / maxValue) * 100 : 0;
          return (
            <div key={entry.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-flex items-center justify-center w-12 h-5 rounded-full text-white font-semibold"
                    style={{ backgroundColor: color, fontSize: '10px' }}
                  >
                    {entry.name}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-700">{formatNumber(entry.value)}</span>
                  <span className="text-gray-400 w-10 text-right">{entry.pct.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>Total impressões</span>
        <span className="font-bold text-gray-700 text-sm">{formatNumber(total)}</span>
      </div>

      {/* Gráfico de barras Recharts (escondido visualmente, mas abaixo como complemento) */}
      <div className="mt-4" style={{ height: 120 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={28} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map(entry => (
                <Cell key={entry.name} fill={FAIXA_COLORS[entry.name] ?? DEFAULT_COLOR} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MoovitFaixaEtariaChart;
