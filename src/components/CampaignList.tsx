import { CampaignSummary, ProcessedCampaignData, Filters } from '../types/campaign';
import { useMemo } from 'react';
import { subDays } from 'date-fns';

interface CampaignListProps {
  campaigns: CampaignSummary[];
  selectedCampaign: string | null;
  onSelectCampaign: (campaignName: string) => void;
  data?: ProcessedCampaignData[];
  filters?: Filters;
  periodFilter?: '7days' | 'all';
  selectedPI?: string | null;
  onSelectPI?: (pi: string | null) => void;
  selectedVehicle?: string | null;
}

const formatCurrency = (num: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(num);
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('pt-BR').format(num);
};

const CampaignList = ({ campaigns, selectedCampaign, onSelectCampaign, data, filters, periodFilter, selectedPI, onSelectPI, selectedVehicle }: CampaignListProps) => {
  // Calcula os PIs disponíveis para cada campanha baseado nos filtros de data e veículo
  const campaignPIs = useMemo(() => {
    if (!data) return new Map<string, string[]>();

    const pisByCampaign = new Map<string, Set<string>>();

    let filteredData = [...data];

    // Aplica filtros de data
    const yesterday = subDays(new Date(), 1);
    filteredData = filteredData.filter(item => item.date <= yesterday);

    if (filters?.dateRange.start) {
      filteredData = filteredData.filter(d => d.date >= filters.dateRange.start!);
    }
    if (filters?.dateRange.end) {
      filteredData = filteredData.filter(d => d.date <= filters.dateRange.end!);
    }

    // Aplica filtro de período
    if (periodFilter === '7days') {
      const sevenDaysAgo = subDays(yesterday, 7);
      filteredData = filteredData.filter(item => item.date >= sevenDaysAgo);
    }

    // Aplica filtro de veículo
    if (selectedVehicle) {
      filteredData = filteredData.filter(d => d.veiculo === selectedVehicle);
    }

    // Agrupa PIs por campanha
    filteredData.forEach(item => {
      if (item.numeroPi) {
        if (!pisByCampaign.has(item.campanha)) {
          pisByCampaign.set(item.campanha, new Set());
        }
        pisByCampaign.get(item.campanha)!.add(item.numeroPi);
      }
    });

    // Converte Sets para Arrays ordenados
    const result = new Map<string, string[]>();
    pisByCampaign.forEach((pisSet, campanha) => {
      result.set(campanha, Array.from(pisSet).sort());
    });

    return result;
  }, [data, filters, periodFilter, selectedVehicle]);

  const handlePIClick = (pi: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelectPI) {
      onSelectPI(selectedPI === pi ? null : pi);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 h-full flex flex-col">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Campanhas Ativas ({campaigns.length})
        </h2>
        {(selectedCampaign || selectedPI) && (
          <div className="flex gap-2">
            {selectedCampaign && (
              <button
                onClick={() => onSelectCampaign('')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar campanha
              </button>
            )}
            {selectedPI && (
              <button
                onClick={() => onSelectPI?.(null)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Limpar PI
              </button>
            )}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {campaigns.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhuma campanha encontrada
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {campaigns.map((campaign) => (
              <div
                key={campaign.nome}
                onClick={() => onSelectCampaign(campaign.nome)}
                className={`px-6 py-4 hover:bg-blue-50 transition-colors cursor-pointer ${
                  selectedCampaign === campaign.nome ? 'bg-blue-50 border-l-4 border-blue-600' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        campaign.status === 'active'
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}
                      title={
                        campaign.status === 'active'
                          ? 'Ativa nos últimos 7 dias'
                          : 'Inativa'
                      }
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {campaign.nome}
                    </p>
                    <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Investimento:</span>{' '}
                        {formatCurrency(
                          campaign.metrics.investimentoReal && campaign.metrics.investimentoReal > 0
                            ? campaign.metrics.investimentoReal
                            : campaign.metrics.investimento
                        )}
                      </div>
                      <div>
                        <span className="font-medium">Impressões:</span>{' '}
                        {formatNumber(campaign.metrics.impressoes)}
                      </div>
                      <div>
                        <span className="font-medium">Cliques:</span>{' '}
                        {formatNumber(campaign.metrics.cliques)}
                      </div>
                    </div>

                    {/* Botões de PI */}
                    {campaignPIs.get(campaign.nome) && campaignPIs.get(campaign.nome)!.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-medium text-gray-500 mb-1.5">Números PI:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {campaignPIs.get(campaign.nome)!.map(pi => (
                            <button
                              key={pi}
                              onClick={(e) => handlePIClick(pi, e)}
                              className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                                selectedPI === pi
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pi}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignList;
