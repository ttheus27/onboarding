import axios from 'axios'

/**
 * Valores base para cálculo do custo de setup
 */
const VALORES_BASE = {
  USD: 100,      // $100 USD
  BTC: 0.00153,  // 0.00153 BTC
  ETH: 0.521     // 0.521 ETH
}

/**
 * Taxas aplicadas
 */
const TAXAS = {
  SPREAD: 0.01,  // 1% de spread
  IOF: 0.035     // 3.5% de IOF
}

/**
 * Busca cotação de criptomoedas usando CoinGecko API (gratuita, sem limite)
 * @returns {Promise<Object>} Cotações em USD
 */
export async function buscarCotacoes() {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
      params: {
        ids: 'bitcoin,ethereum,usd-coin,tether',
        vs_currencies: 'usd,brl'
      }
    })

    return {
      BTC: {
        usd: response.data.bitcoin.usd,
        brl: response.data.bitcoin.brl
      },
      ETH: {
        usd: response.data.ethereum.usd,
        brl: response.data.ethereum.brl
      },
      USDC: {
        usd: response.data['usd-coin'].usd,
        brl: response.data['usd-coin'].brl
      },
      USDT: {
        usd: response.data.tether.usd,
        brl: response.data.tether.brl
      },
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Erro ao buscar cotações:', error)
    throw new Error('Não foi possível obter as cotações. Tente novamente.')
  }
}

/**
 * Busca apenas a cotação do dólar em reais usando AwesomeAPI (gratuita)
 * @returns {Promise<number>} Cotação USD/BRL
 */
export async function buscarCotacaoDolar() {
  try {
    const response = await axios.get('https://economia.awesomeapi.com.br/json/last/USD-BRL')
    return parseFloat(response.data.USDBRL.bid)
  } catch (error) {
    console.error('Erro ao buscar cotação do dólar:', error)
    throw new Error('Não foi possível obter a cotação do dólar.')
  }
}

/**
 * Calcula o custo de setup da conta em reais
 * 
 * Fórmula:
 * custo_base = valor_em_USD × cotação_BRL_USD
 * com_spread = custo_base × 1.01
 * com_iof    = com_spread × 1.035
 * final      = ceil(com_iof × 100) / 100
 * 
 * @param {string} moeda - Moeda selecionada (BTC, ETH, USDC, USDT)
 * @param {Object} cotacoes - Objeto com as cotações
 * @returns {Object} Objeto com valores detalhados
 */
export function calcularCustoSetup(moeda, cotacoes) {
  let valorEmUSD = 0
  
  // Calcula o valor em USD baseado na moeda selecionada
  switch (moeda) {
    case 'BTC':
      valorEmUSD = VALORES_BASE.BTC * cotacoes.BTC.usd
      break
    case 'ETH':
      valorEmUSD = VALORES_BASE.ETH * cotacoes.ETH.usd
      break
    case 'USDC':
    case 'USDT':
      valorEmUSD = VALORES_BASE.USD // Stablecoins = $100 USD direto
      break
    default:
      valorEmUSD = VALORES_BASE.USD
  }
  
  // Busca cotação do dólar em reais
  // Nota: Para BTC e ETH, já temos a cotação direta em BRL
  let custoBase = 0
  
  if (moeda === 'BTC') {
    custoBase = VALORES_BASE.BTC * cotacoes.BTC.brl
  } else if (moeda === 'ETH') {
    custoBase = VALORES_BASE.ETH * cotacoes.ETH.brl
  } else {
    // Para USDC e USDT, usa a cotação do dólar
    custoBase = valorEmUSD * (cotacoes.USDC.brl / cotacoes.USDC.usd)
  }
  
  // Aplica spread de 1%
  const comSpread = custoBase * (1 + TAXAS.SPREAD)
  
  // Aplica IOF de 3.5%
  const comIOF = comSpread * (1 + TAXAS.IOF)
  
  // Arredonda para cima com 2 casas decimais
  const final = Math.ceil(comIOF * 100) / 100
  
  return {
    moeda,
    valorBase: custoBase.toFixed(2),
    spread: (comSpread - custoBase).toFixed(2),
    iof: (comIOF - comSpread).toFixed(2),
    total: final.toFixed(2),
    valorEmUSD: valorEmUSD.toFixed(2),
    detalhes: {
      custoBase: `R$ ${custoBase.toFixed(2)}`,
      comSpread: `R$ ${comSpread.toFixed(2)}`,
      comIOF: `R$ ${comIOF.toFixed(2)}`,
      final: `R$ ${final.toFixed(2)}`
    }
  }
}

/**
 * Função completa que busca cotações e calcula o custo
 * @param {string} moeda - Moeda selecionada (BTC, ETH, USDC, USDT)
 * @returns {Promise<Object>} Objeto com o custo calculado
 */
export async function obterCustoSetup(moeda) {
  try {
    const cotacoes = await buscarCotacoes()
    const custo = calcularCustoSetup(moeda, cotacoes)
    
    return {
      ...custo,
      cotacoes,
      timestamp: cotacoes.timestamp
    }
  } catch (error) {
    console.error('Erro ao obter custo de setup:', error)
    throw error
  }
}

/**
 * Formata o valor em reais
 * @param {number} valor - Valor a ser formatado
 * @returns {string} Valor formatado (ex: R$ 1.234,56)
 */
export function formatarReal(valor) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

/**
 * Formata a cotação de criptomoeda
 * @param {number} valor - Valor da cotação
 * @param {string} moeda - Moeda (BTC, ETH, etc.)
 * @returns {string} Valor formatado
 */
export function formatarCotacao(valor, moeda) {
  if (moeda === 'BTC') {
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else if (moeda === 'ETH') {
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  } else {
    return `${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }
}
