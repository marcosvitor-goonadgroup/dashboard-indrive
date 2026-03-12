# Dashboard BRB - Campanhas de Mídia Online

Dashboard para visualização e análise de campanhas de mídia online do Banco BRB.

## 🚀 Tecnologias

- **React 19** com **TypeScript**
- **Vite** - Build tool
- **Tailwind CSS** - Estilização
- **Recharts** - Gráficos
- **Axios** - Requisições HTTP
- **date-fns** - Manipulação de datas
- **Context API** - Gerenciamento de estado

## 📊 Funcionalidades

- ✅ Visualização de campanhas ativas/inativas (últimos 7 dias)
- ✅ Big numbers: Investimento, Impressões, Cliques, Views, Engajamento
- ✅ Métricas e taxas: CPM, CPC, CPV, CPE, CTR, VTR, Taxa de Engajamento
- ✅ Gráfico de linha com evolução de impressões ao longo do tempo
- ✅ Integração com 2 fontes de dados (Google Sheets via API)
- ✅ Context API para gerenciar dados consolidados
- ✅ Filtros preparados: Date, Veículo, Tipo de Compra, Campanha

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── Header.tsx       # Cabeçalho com logo BRB
│   ├── BigNumbers.tsx   # Métricas principais
│   ├── CampaignList.tsx # Lista de campanhas
│   └── ImpressionsChart.tsx # Gráfico de impressões
├── contexts/            # Context API
│   └── CampaignContext.tsx # Gerenciamento de dados e filtros
├── services/            # Serviços
│   └── api.ts          # Integração com APIs
├── types/              # Tipos TypeScript
│   └── campaign.ts     # Tipos de dados
├── styles/             # Estilos
│   └── index.css       # Tailwind CSS
├── images/             # Imagens
│   └── logo-brb.png    # Logo do Banco BRB
├── App.tsx             # Componente principal
└── main.tsx            # Entry point
```

## 🎯 Fontes de Dados

O dashboard consome dados de 2 APIs (Google Sheets):

1. `https://nmbcoamazonia-api.vercel.app/google/sheets/1HykUxjCGGdveDS_5vlLOOkAq7Wkl058453xkYGTAzNM/data?range=Consolidado`
2. `https://nmbcoamazonia-api.vercel.app/google/sheets/1abcar-ESRB_f8ytKGQ_ru_slZ67cXhjxKt8gL7TrEVw/data?range=Consolidado`

## 📈 Campos de Dados

- **Date** - Data da veiculação
- **Campaign name** - Nome da campanha
- **Ad Set Name** - Nome do conjunto de anúncios
- **Ad Name** - Nome do anúncio
- **Cost** - Custo/Investimento
- **Impressions** - Impressões
- **Reach** - Alcance
- **Clicks** - Cliques
- **Video views** - Visualizações de vídeo
- **Video completions** - Vídeos completos
- **Total engagements** - Engajamento total
- **Veículo** - Plataforma (LinkedIn, Facebook, etc.)
- **Tipo de Compra** - CPM, CPC, etc.
- **Campanha** - Nome da campanha do cliente

## 🎨 Indicadores de Status

- 🟢 **Verde** - Campanha ativa nos últimos 7 dias (impressões/cliques/views > 0 e investimento > 0)
- ⚫ **Cinza** - Campanha inativa

## 🛠️ Comandos

```bash
# Instalar dependências
npm install

# Rodar em desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview
```

## 🌐 Acesso

Servidor de desenvolvimento: **http://localhost:5174/**

---

Desenvolvido por GO ON
