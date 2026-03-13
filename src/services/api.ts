import axios from 'axios';
import { ApiResponse, ProcessedCampaignData, PricingTableRow } from '../types/campaign';
import { parse } from 'date-fns';

const API_URLS = [
  'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Consolidado'
];

const PRICING_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1zgRBEs_qi_9DdYLqw-cEedD1u66FS88ku6zTZ0gV-oU/data?range=base';

const PI_INFO_BASE_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1T35Pzw9ZA5NOTLHsTqMGZL5IEedpSGdZHJ2ElrqLs1M/data';
const PI_INFO_API_URL = `${PI_INFO_BASE_URL}?range=base`;
const PI_INFO_REPRESENTACAO_URL = `${PI_INFO_BASE_URL}?range=representacao`;

export const MOOVIT_DEVICE_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Device';

export const MOOVIT_HOUR_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Hora';

export const MOOVIT_OPERADORA_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Operadora';

export const MOOVIT_APARELHO_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Aparelho';

export const MOOVIT_MAPA_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Mapa';

export const MOOVIT_GENERO_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Genero';

export const MOOVIT_FAIXA_ETARIA_API_URL = 'https://nmbcoamazonia-api.vercel.app/google/sheets/1Mm3SAsFUtMATjyr3K3UII4r5wF-eMJ-LfVct8MZJEGk/data?range=Moovit%20-%20Faixa%20Etaria%20de%20Idade';

const parseNumber = (value: string): number => {
  if (!value || value === '') return 0;
  const cleaned = value.replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const parseCurrency = (value: string): number => {
  if (!value || value === '') return 0;
  // Remove "R$" e espaços, depois processa como número
  const cleaned = value.replace('R$', '').trim().replace(/\./g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const parsePercentage = (value: string): number => {
  if (!value || value === '') return 0;
  // Remove "%" e converte para decimal
  const cleaned = value.replace('%', '').trim().replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const parseDate = (dateString: string): Date => {
  try {
    return parse(dateString, 'dd/MM/yyyy', new Date());
  } catch {
    return new Date();
  }
};


const normalizeVeiculo = (veiculo: string): string => {
  const normalized = veiculo.trim();
  if (normalized === 'Audience Network' || normalized === 'Messenger') {
    return 'Facebook';
  }
  return normalized;
};

export const fetchCampaignData = async (): Promise<ProcessedCampaignData[]> => {
  try {
    const responses = await Promise.all(
      API_URLS.map(url => axios.get<ApiResponse>(url))
    );

    const allData: ProcessedCampaignData[] = [];
    let googleSearchCount = 0;

    responses.forEach((response, apiIndex) => {
      const apiUrl = API_URLS[apiIndex];
      console.log(`Processando API ${apiIndex + 1}: ${apiUrl}`);

      if (response.data.success && response.data.data.values.length > 1) {
        const rows = response.data.data.values.slice(1);
        let googleSearchInApi = 0;

        rows.forEach(row => {
          if (row.length >= 18) {
            const veiculoRaw = row[14] || '';
            const veiculo = normalizeVeiculo(veiculoRaw);

            // Debug: log linhas do Google Search
            if (veiculoRaw.toLowerCase().includes('google') || veiculoRaw === 'Google Search') {
              googleSearchInApi++;
              googleSearchCount++;
            }

            const dataRow: ProcessedCampaignData = {
              date: parseDate(row[0]),
              campaignName: row[1] || '',
              adSetName: row[2] || '',
              adName: row[3] || '',
              cost: parseCurrency(row[4]),
              impressions: parseNumber(row[5]),
              reach: parseNumber(row[6]),
              clicks: parseNumber(row[7]),
              videoViews: parseNumber(row[8]),
              videoViews25: parseNumber(row[9]),
              videoViews50: parseNumber(row[10]),
              videoViews75: parseNumber(row[11]),
              videoCompletions: parseNumber(row[12]),
              totalEngagements: parseNumber(row[13]),
              veiculo: veiculo,
              tipoDeCompra: row[15] || '',
              videoEstaticoAudio: row[16] || '',
              viewability: parseNumber(row[17]),
              campanha: row[18] || '',
              numeroPi: row[19] || ''
            };
            allData.push(dataRow);
          }
        });

        console.log(`API ${apiIndex + 1} - Google Search encontrados: ${googleSearchInApi}`);
      }
    });

    console.log(`Total de linhas Google Search encontradas em todas as APIs: ${googleSearchCount}`);
    return allData;
  } catch (error) {
    console.error('Erro ao buscar dados das campanhas:', error);
    throw error;
  }
};


export const fetchPricingTable = async (): Promise<PricingTableRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(PRICING_API_URL);

    if (response.data.success && response.data.data.values.length > 1) {
      const rows = response.data.data.values.slice(1); // Pula o header

      const pricingData: PricingTableRow[] = rows.map(row => ({
        veiculo: row[0] || '',
        canal: row[1] || '',
        formato: row[2] || '',
        tipoDeCompra: row[3] || '',
        valorUnitario: parseCurrency(row[4]),
        desconto: parsePercentage(row[5]),
        valorFinal: parseCurrency(row[6])
      }));

      return pricingData;
    }

    return [];
  } catch (error) {
    console.error('Erro ao buscar tabela de preços:', error);
    throw error;
  }
};


/**
 * Busca informações de um PI específico (nas abas "base" e "representacao")
 */
export const fetchPIInfo = async (numeroPi: string) => {
  try {
    const normalizedPi = numeroPi.replace(/^0+/, '').replace(/\./g, '').replace(',', '.');

    const [baseRes, reprRes] = await Promise.allSettled([
      axios.get(PI_INFO_API_URL),
      axios.get(PI_INFO_REPRESENTACAO_URL)
    ]);

    const piInfo: ReturnType<typeof mapBaseRow>[] = [];

    // Aba "base"
    if (baseRes.status === 'fulfilled' && baseRes.value.data.success && baseRes.value.data.data.values) {
      const rows: string[][] = baseRes.value.data.data.values.slice(1);
      rows
        .filter(row => (row[0] || '').replace(/^0+/, '').replace(/\./g, '').replace(',', '.') === normalizedPi)
        .forEach(row => piInfo.push(mapBaseRow(row)));
    }

    // Aba "representacao"
    if (reprRes.status === 'fulfilled' && reprRes.value.data.success && reprRes.value.data.data.values) {
      const rows: string[][] = reprRes.value.data.data.values.slice(1);
      rows
        .filter(row => (row[2] || '').replace(/^0+/, '').replace(/\./g, '').replace(',', '.') === normalizedPi)
        .forEach(row => piInfo.push(mapRepresentacaoRow(row)));
    }

    return piInfo.length > 0 ? piInfo : null;
  } catch (error) {
    console.error('Erro ao buscar informações do PI:', error);
    return null;
  }
};

const mapBaseRow = (row: string[]) => ({
  numeroPi: row[0] || '',
  veiculo: row[1] || '',
  canal: row[2] || '',
  formato: row[3] || '',
  modeloCompra: row[4] || '',
  valorNegociado: row[7] || '',
  quantidade: row[8] || '',
  totalBruto: row[9] || '',
  status: row[11] || '',
  segmentacao: row[12] || '',
  alcance: row[13] || '',
  inicio: row[14] || '',
  fim: row[15] || '',
  publico: row[16] || '',
  praca: row[17] || '',
  objetivo: row[18] || ''
});

const mapRepresentacaoRow = (row: string[]) => ({
  numeroPi: row[2] || '',
  veiculo: row[3] || '',   // Formato usado como veículo
  canal: '',
  formato: row[3] || '',
  modeloCompra: row[4] || '',  // Modelos (CPM, CPC...)
  valorNegociado: row[11] || '', // Valor Unitário Desc.
  quantidade: row[9] || '',    // Volume
  totalBruto: row[13] || '',   // Bruto Negociado
  status: '',
  segmentacao: row[5] || '',
  alcance: row[6] || '',
  inicio: row[7] || '',
  fim: row[8] || '',
  publico: '',
  praca: row[14] || '',
  objetivo: row[15] || ''
});

export interface MoovitDeviceRow {
  date: Date;
  device: string;
  totalImpressions: number;
}

export interface MoovitHourRow {
  date: Date;
  hour: number;
  totalImpressions: number;
}

export const fetchMoovitDeviceData = async (): Promise<MoovitDeviceRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_DEVICE_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        date: parseDate(row[0]),
        device: row[1] || '',
        totalImpressions: parseNumber(row[2])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de dispositivo Moovit:', error);
    return [];
  }
};

export interface MoovitOperadoraRow {
  date: Date;
  operadora: string;
  totalImpressions: number;
}

export interface MoovitAparelhoRow {
  date: Date;
  aparelho: string;
  totalImpressions: number;
}

export const fetchMoovitOperadoraData = async (): Promise<MoovitOperadoraRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_OPERADORA_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        date: parseDate(row[0]),
        operadora: row[1] || '',
        totalImpressions: parseNumber(row[2])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de operadora Moovit:', error);
    return [];
  }
};

export const fetchMoovitAparelhoData = async (): Promise<MoovitAparelhoRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_APARELHO_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        date: parseDate(row[0]),
        aparelho: row[1] || '',
        totalImpressions: parseNumber(row[2])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de aparelho Moovit:', error);
    return [];
  }
};

export interface MoovitMapaRow {
  date: Date;
  city: string;
  totalImpressions: number;
  totalClicks: number;
}

export const fetchMoovitMapaData = async (): Promise<MoovitMapaRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_MAPA_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        date: parseDate(row[0]),
        city: row[1] || '',
        totalImpressions: parseNumber(row[2]),
        totalClicks: parseNumber(row[3])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de mapa Moovit:', error);
    return [];
  }
};

export interface MoovitGeneroRow {
  genero: string;
  impressoes: number;
}

export const fetchMoovitGeneroData = async (): Promise<MoovitGeneroRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_GENERO_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        genero: row[0] || '',
        impressoes: parseNumber(row[1])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de gênero Moovit:', error);
    return [];
  }
};

export interface MoovitFaixaEtariaRow {
  faixa: string;
  impressoes: number;
}

export const fetchMoovitFaixaEtariaData = async (): Promise<MoovitFaixaEtariaRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_FAIXA_ETARIA_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        faixa: row[0] || '',
        impressoes: parseNumber(row[1])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de faixa etária Moovit:', error);
    return [];
  }
};

export const fetchMoovitHourData = async (): Promise<MoovitHourRow[]> => {
  try {
    const response = await axios.get<ApiResponse>(MOOVIT_HOUR_API_URL);
    if (response.data.success && response.data.data.values.length > 1) {
      return response.data.data.values.slice(1).map(row => ({
        date: parseDate(row[0]),
        hour: parseInt(row[3], 10) || 0, // Usa "Hora ajustada" (col 3) ao invés de "Hour" (col 1)
        totalImpressions: parseNumber(row[2])
      }));
    }
    return [];
  } catch (error) {
    console.error('Erro ao buscar dados de hora Moovit:', error);
    return [];
  }
};
