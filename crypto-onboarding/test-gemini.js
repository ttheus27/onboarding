// Teste rápido da API Gemini
// Execute: node test-gemini.js

import axios from 'axios'

// ⚠️ AVISO: Lembre-se de trocar essa chave depois, pois ela ficou exposta!
const GEMINI_API_KEY = 'AIzaSyAI5dIPitqL3zrD3Q-Hgl9118b9V7pujcs' 

// 👇 AQUI ESTÁ A CORREÇÃO: troquei para "gemini-flash-latest"
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent'

async function testarGemini() {
  try {
    console.log('🔑 Testando chave:', GEMINI_API_KEY.substring(0, 10) + '...')
    console.log('🌐 URL:', GEMINI_API_URL)
    
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: 'Diga apenas "OK" se você está funcionando.'
          }]
        }]
      }
    )
    
    console.log('✅ Sucesso!')
    console.log('📝 Resposta:', response.data.candidates[0].content.parts[0].text)
    
  } catch (error) {
    console.error('❌ Erro:', error.response?.status, error.response?.statusText)
    console.error('📄 Detalhes:', error.response?.data)
    
    if (error.response?.status === 404) {
      console.log('\n⚠️  ERRO 404: Modelo não encontrado na URL')
      console.log('Verifique se o nome do modelo (ex: gemini-flash-latest) está correto na URL.')
    }
  }
}

testarGemini()