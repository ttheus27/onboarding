# Integração da API de Cotações de Moedas

Este guia mostra como usar o serviço de cotações de criptomoedas para calcular o custo de setup da conta.

## APIs Utilizadas

### 1. CoinGecko API (Implementada)
- ✅ Gratuita
- ✅ Sem necessidade de chave
- ✅ Sem limite de requisições
- ✅ Retorna cotações em USD e BRL
- URL: `https://api.coingecko.com/api/v3/simple/price`

### 2. AwesomeAPI (Implementada como alternativa)
- ✅ Gratuita
- ✅ Cotação USD/BRL
- URL: `https://economia.awesomeapi.com.br/json/last/USD-BRL`

## Fórmula de Cálculo

Conforme especificado no Requisito 6:

```
custo_base = valor_em_USD × cotação_BRL_USD
com_spread = custo_base × 1.01          (1% de spread)
com_iof    = com_spread × 1.035         (3.5% de IOF)
final      = ceil(com_iof × 100) / 100  (arredonda pra cima)
```

### Valores Base:
- **USD**: $100
- **BTC**: 0.00153 BTC
- **ETH**: 0.521 ETH
- **USDC/USDT**: $100 (stablecoins)

## Como Usar

### 1. Buscar Cotações

```javascript
import { buscarCotacoes } from '@/services/quotes'

const cotacoes = await buscarCotacoes()

// Retorna:
{
  BTC: { usd: 45000, brl: 225000 },
  ETH: { usd: 2500, brl: 12500 },
  USDC: { usd: 1, brl: 5 },
  USDT: { usd: 1, brl: 5 },
  timestamp: "2024-03-12T10:30:00.000Z"
}
```

### 2. Calcular Custo de Setup

```javascript
import { obterCustoSetup } from '@/services/quotes'

const custo = await obterCustoSetup('BTC')

// Retorna:
{
  moeda: 'BTC',
  valorBase: '344.25',
  spread: '3.44',
  iof: '12.17',
  total: '359.86',
  valorEmUSD: '68.85',
  detalhes: {
    custoBase: 'R$ 344.25',
    comSpread: 'R$ 347.69',
    comIOF: 'R$ 359.86',
    final: 'R$ 359.86'
  },
  cotacoes: { ... },
  timestamp: "2024-03-12T10:30:00.000Z"
}
```

### 3. Formatar Valores

```javascript
import { formatarReal, formatarCotacao } from '@/services/quotes'

formatarReal(359.86)           // "R$ 359,86"
formatarCotacao(45000, 'BTC')  // "45.000,00"
```

## Integração na Tela de Registro

### Passo 1: Importar o serviço

```vue
<script setup>
import { ref, onMounted, watch } from 'vue'
import { obterCustoSetup, formatarReal } from '@/services/quotes'

const custoSetup = ref(null)
const loadingCusto = ref(false)
const intervalId = ref(null)
</script>
```

### Passo 2: Buscar cotação ao selecionar moeda

```javascript
// Observa mudanças na moeda selecionada
watch(() => company.value.cryptos, async (novaMoeda) => {
  if (novaMoeda) {
    await atualizarCustoSetup(novaMoeda)
  }
})

async function atualizarCustoSetup(moeda) {
  if (!moeda) return
  
  loadingCusto.value = true
  
  try {
    const custo = await obterCustoSetup(moeda)
    custoSetup.value = custo
  } catch (error) {
    console.error('Erro ao buscar custo:', error)
  } finally {
    loadingCusto.value = false
  }
}
```

### Passo 3: Atualizar a cada 5 segundos

```javascript
onMounted(() => {
  // Atualiza a cada 5 segundos se houver moeda selecionada
  intervalId.value = setInterval(() => {
    if (company.value.cryptos) {
      atualizarCustoSetup(company.value.cryptos)
    }
  }, 5000)
})

onUnmounted(() => {
  // Limpa o intervalo ao desmontar
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
```

### Passo 4: Exibir no template

```vue
<template>
  <!-- Após o campo de seleção de moeda -->
  <div v-if="custoSetup" class="custo-setup-card mt-3">
    <div class="custo-header">
      <span class="custo-label">Custo de Setup da Conta</span>
      <span v-if="loadingCusto" class="spinner-border spinner-border-sm"></span>
    </div>
    
    <div class="custo-valor">
      {{ formatarReal(parseFloat(custoSetup.total)) }}
    </div>
    
    <div class="custo-detalhes">
      <div class="detalhe-item">
        <span>Base ({{ custoSetup.moeda }}):</span>
        <span>{{ custoSetup.detalhes.custoBase }}</span>
      </div>
      <div class="detalhe-item">
        <span>Spread (1%):</span>
        <span>R$ {{ custoSetup.spread }}</span>
      </div>
      <div class="detalhe-item">
        <span>IOF (3.5%):</span>
        <span>R$ {{ custoSetup.iof }}</span>
      </div>
    </div>
    
    <small class="text-muted">
      Atualizado em: {{ new Date(custoSetup.timestamp).toLocaleTimeString('pt-BR') }}
    </small>
  </div>
</template>
```

### Passo 5: Adicionar CSS

```css
.custo-setup-card {
  background: linear-gradient(135deg, rgba(0, 201, 177, 0.1), rgba(123, 47, 190, 0.1));
  border: 1px solid #00C9B1;
  border-radius: 12px;
  padding: 1rem;
}

.custo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.custo-label {
  font-size: 0.85rem;
  color: #8B7EAB;
  font-weight: 600;
}

.custo-valor {
  font-size: 1.8rem;
  font-weight: 700;
  color: #00C9B1;
  margin-bottom: 0.75rem;
}

.custo-detalhes {
  border-top: 1px solid rgba(0, 201, 177, 0.2);
  padding-top: 0.75rem;
  margin-bottom: 0.5rem;
}

.detalhe-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: #6B7280;
  margin-bottom: 0.25rem;
}
```

## Exemplo de Resposta Completa

```javascript
// Para BTC (0.00153 BTC)
{
  moeda: 'BTC',
  valorBase: '344.25',      // 0.00153 × R$ 225.000 (cotação BRL)
  spread: '3.44',           // 1% de R$ 344.25
  iof: '12.17',             // 3.5% de R$ 347.69
  total: '359.86',          // Arredondado para cima
  valorEmUSD: '68.85',      // 0.00153 × $45.000 (cotação USD)
  detalhes: {
    custoBase: 'R$ 344,25',
    comSpread: 'R$ 347,69',
    comIOF: 'R$ 359,86',
    final: 'R$ 359,86'
  },
  cotacoes: {
    BTC: { usd: 45000, brl: 225000 },
    ETH: { usd: 2500, brl: 12500 },
    USDC: { usd: 1, brl: 5 },
    USDT: { usd: 1, brl: 5 }
  },
  timestamp: '2024-03-12T10:30:00.000Z'
}
```

## Tratamento de Erros

```javascript
try {
  const custo = await obterCustoSetup('BTC')
  custoSetup.value = custo
} catch (error) {
  if (error.message.includes('cotações')) {
    // Erro ao buscar cotações
    alert('Não foi possível obter as cotações. Verifique sua conexão.')
  } else {
    // Erro genérico
    alert('Erro ao calcular custo de setup.')
  }
}
```

## Testes

### Testar busca de cotações
```javascript
import { buscarCotacoes } from '@/services/quotes'

const cotacoes = await buscarCotacoes()
console.log('Cotações:', cotacoes)
```

### Testar cálculo de custo
```javascript
import { obterCustoSetup } from '@/services/quotes'

const custoBTC = await obterCustoSetup('BTC')
const custoETH = await obterCustoSetup('ETH')
const custoUSDC = await obterCustoSetup('USDC')

console.log('BTC:', custoBTC.total)
console.log('ETH:', custoETH.total)
console.log('USDC:', custoUSDC.total)
```

## Fórmula em LaTeX

Para documentação:

```latex
\text{custo\_base} = \text{valor\_em\_USD} \times \text{cotação\_BRL\_USD}

\text{com\_spread} = \text{custo\_base} \times 1.01

\text{com\_iof} = \text{com\_spread} \times 1.035

\text{final} = \left\lceil \text{com\_iof} \times 100 \right\rceil \div 100
```

## Checklist de Implementação

- [x] Criar serviço `quotes.js`
- [x] Implementar `buscarCotacoes()`
- [x] Implementar `calcularCustoSetup()`
- [x] Implementar `obterCustoSetup()`
- [x] Implementar helpers de formatação
- [x] Documentar fórmula
- [x] Integrar na RegisterView
- [x] Adicionar watch na moeda selecionada
- [x] Adicionar intervalo de 5 segundos
- [x] Adicionar card visual
- [x] Testar com todas as moedas
- [x] Adicionar tratamento de erros

## Performance

- ✅ API CoinGecko é rápida (~200ms)
- ✅ Sem limite de requisições
- ✅ Cache pode ser implementado se necessário
- ✅ Atualização a cada 5 segundos é leve

## Observações

- As cotações são em tempo real
- O cálculo é feito localmente (rápido)
- Stablecoins (USDC/USDT) sempre ~R$ 5,00 × 100 = R$ 500,00
- BTC e ETH variam conforme o mercado
- Arredondamento sempre para cima (favorece a empresa)
