import { PricingTableRow, ProcessedCampaignData } from '../types/campaign';

/**
 * Calcula o investimento real baseado na tabela de preços
 * @param data - Dados da campanha
 * @param pricingTable - Tabela de preços de referência
 * @returns Investimento calculado
 */
export const calculateRealInvestment = (
  data: ProcessedCampaignData,
  pricingTable: PricingTableRow[]
): number => {
  // Cálculo específico para Google Search: Clicks × R$ 56,88
  if (data.veiculo === 'Google Search') {
    const realInvestment = data.clicks * 56.88;
    return realInvestment;
  }

  // Cálculo específico para YouTube CPV ou CPM: Views × R$ 1,26
  const tipoDeCompraUpper = data.tipoDeCompra.toUpperCase();
  if (data.veiculo === 'YouTube' && (tipoDeCompraUpper === 'CPV' || tipoDeCompraUpper === 'CPM')) {
    const realInvestment = data.videoViews * 1.26;
    return realInvestment;
  }

  // Busca o preço correspondente ao veículo e tipo de compra
  const pricing = pricingTable.find(
    p => p.veiculo === data.veiculo && p.tipoDeCompra === data.tipoDeCompra
  );

  if (!pricing) {
    // Se não encontrar preço na tabela, retorna o custo original
    console.warn(`Preço não encontrado para veículo "${data.veiculo}" e tipo de compra "${data.tipoDeCompra}"`);

    return data.cost;
  }


  const tipoDeCompra = data.tipoDeCompra.toUpperCase();

  // Calcula baseado no tipo de compra
  switch (tipoDeCompra) {
    case 'CPC': // Custo por Clique
      return data.clicks * pricing.valorFinal;

    case 'CPM': // Custo por Mil Impressões
      return (data.impressions / 1000) * pricing.valorFinal;

    case 'CPV': // Custo por Visualização
      return data.videoViews * pricing.valorFinal;

    case 'CPE': // Custo por Engajamento
      return data.totalEngagements * pricing.valorFinal;

    case 'CPD': // Custo por Disparo (assumindo que é por impressão)
      return data.impressions * pricing.valorFinal;

    case 'CPA': // Custo por Ação (assumindo que é por clique)
      return data.clicks * pricing.valorFinal;

    case 'VPI': // Visualização por Impressão (assumindo que é por impressão)
      return data.impressions * pricing.valorFinal;

    default:
      console.warn(`Tipo de compra "${data.tipoDeCompra}" não reconhecido`);
      return data.cost;
  }
};

/**
 * Calcula o investimento total para um conjunto de dados
 * @param dataArray - Array de dados de campanha
 * @param pricingTable - Tabela de preços de referência
 * @returns Investimento total calculado
 */
export const calculateTotalRealInvestment = (
  dataArray: ProcessedCampaignData[],
  pricingTable: PricingTableRow[]
): number => {
  return dataArray.reduce((total, data) => {
    return total + calculateRealInvestment(data, pricingTable);
  }, 0);
};
