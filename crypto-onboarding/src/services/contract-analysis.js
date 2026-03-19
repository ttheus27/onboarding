import axios from 'axios'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

/**
 * Converte arquivo PDF para base64
 */
async function pdfToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analisa contrato social usando Gemini API
 * VANTAGEM: Gemini aceita PDF direto, sem precisar extrair texto!
 */
export async function analisarContratoComGemini(pdfFile, socios) {
  try {
    // Verifica se a chave de API está configurada
    if (!GEMINI_API_KEY || GEMINI_API_KEY === '') {
      throw new Error('⚠️ Chave de API do Gemini não configurada!\n\n1. Obtenha sua chave em: https://aistudio.google.com/app/apikey\n2. Adicione no arquivo .env:\n   VITE_GEMINI_API_KEY=sua_chave_aqui\n3. Reinicie o servidor (Ctrl+C e npm run dev)')
    }

    console.log('🔑 Chave de API configurada:', GEMINI_API_KEY.substring(0, 10) + '...')
    
    // 1. Converte PDF para base64
    const pdfBase64 = await pdfToBase64(pdfFile)
    
    // 2. Monta o prompt
    const prompt = `Analise este contrato social brasileiro.

SÓCIOS ESPERADOS:
${socios.map(s => `- ${s.fullName}${s.cpf ? ` (CPF: ${s.cpf})` : ''}`).join('\n')}

Retorne APENAS este JSON (sem texto extra):
{
  "sociosPresentes": {"status": true, "detalhes": "breve explicacao", "peso": 30},
  "assinaturaValida": {"status": true, "detalhes": "breve explicacao", "peso": 25},
  "clausulasEssenciais": {"status": true, "detalhes": "breve explicacao", "peso": 25},
  "formatoValido": {"status": true, "detalhes": "breve explicacao", "peso": 20},
  "resumo": "resumo em 1 linha"
}

Critérios:
- sociosPresentes: Todos os sócios estão no contrato?
- assinaturaValida: Tem assinatura digital/ICP-Brasil/gov.br?
- clausulasEssenciais: Tem objeto social, capital, administração, sede?
- formatoValido: É um documento profissional?

IMPORTANTE: Mantenha os detalhes CURTOS (máximo 50 caracteres cada).`

    // 3. Faz requisição para Gemini
    console.log('📤 Enviando para Gemini API...')
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [
            {
              text: prompt
            },
            {
              inline_data: {
                mime_type: 'application/pdf',
                data: pdfBase64
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.2,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048, // Aumentado para evitar corte
        }
      }
    )
    
    console.log('✅ Resposta recebida do Gemini')
    
    // 4. Extrai o JSON da resposta
    const textoResposta = response.data.candidates[0].content.parts[0].text
    
    console.log('📄 Resposta bruta:', textoResposta)
    
    // Verifica se a resposta foi cortada (não termina com })
    if (!textoResposta.trim().endsWith('}')) {
      console.warn('⚠️ Resposta parece estar cortada, tentando extrair o que for possível...')
    }
    
    // Remove markdown se houver (```json ... ```)
    let jsonText = textoResposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    // Remove possíveis textos antes/depois do JSON
    const jsonStart = jsonText.indexOf('{')
    const jsonEnd = jsonText.lastIndexOf('}')
    
    if (jsonStart !== -1 && jsonEnd !== -1) {
      jsonText = jsonText.substring(jsonStart, jsonEnd + 1)
    }
    
    console.log('📋 JSON extraído:', jsonText)
    
    // Tenta fazer parse
    let analise
    try {
      analise = JSON.parse(jsonText)
    } catch (parseError) {
      console.error('🔴 Erro ao fazer parse do JSON:', parseError)
      console.error('📝 JSON que tentou fazer parse:', jsonText)
      
      // Se falhou, tenta criar um objeto padrão baseado no que conseguiu extrair
      throw new Error('O Gemini retornou uma resposta incompleta. Tente novamente.')
    }
    
    return analise
    
  } catch (error) {
    console.error('❌ Erro ao analisar contrato:', error)
    
    // Erro de chave não configurada
    if (error.message.includes('Chave de API')) {
      throw error
    }
    
    // Erro de JSON inválido
    if (error instanceof SyntaxError) {
      console.error('🔴 JSON inválido retornado pelo Gemini')
      throw new Error('O Gemini retornou uma resposta inválida. Tente novamente ou use um PDF diferente.')
    }
    
    // Erro 404 - URL ou chave inválida
    if (error.response?.status === 404) {
      throw new Error('❌ Erro 404: Chave de API inválida ou URL incorreta.\n\n1. Verifique se a chave está correta no .env\n2. Gere uma nova chave em: https://aistudio.google.com/app/apikey\n3. Reinicie o servidor após alterar o .env')
    }
    
    // Erro 403 - Sem permissão
    if (error.response?.status === 403) {
      throw new Error('❌ Erro 403: Chave de API sem permissão.\n\nVerifique se a API Gemini está habilitada em: https://aistudio.google.com/')
    }
    
    // Erro 429 - Limite excedido
    if (error.response?.status === 429) {
      throw new Error('❌ Limite de requisições excedido (1500/dia).\n\nAguarde alguns minutos ou use outra chave.')
    }
    
    throw new Error('Não foi possível analisar o contrato. Tente novamente.')
  }
}

/**
 * Calcula índice de confiança usando lógica fuzzy
 */
export function calcularIndiceConfianca(analise) {
  let indice = 0
  
  // Soma os pesos dos critérios aprovados
  if (analise.sociosPresentes?.status) indice += analise.sociosPresentes.peso
  if (analise.assinaturaValida?.status) indice += analise.assinaturaValida.peso
  if (analise.clausulasEssenciais?.status) indice += analise.clausulasEssenciais.peso
  if (analise.formatoValido?.status) indice += analise.formatoValido.peso
  
  // Define nível de confiança
  let nivel = 'Baixo'
  if (indice >= 85) nivel = 'Alto'
  else if (indice >= 70) nivel = 'Médio'
  
  return {
    indice,
    aprovado: indice >= 70,
    nivel,
    cor: indice >= 85 ? 'success' : indice >= 70 ? 'warning' : 'danger'
  }
}

/**
 * Função completa: analisa e calcula índice
 */
export async function validarContrato(pdfFile, socios) {
  const analise = await analisarContratoComGemini(pdfFile, socios)
  const resultado = calcularIndiceConfianca(analise)
  
  return {
    ...analise,
    ...resultado
  }
}
