# Implementação com Google AI Studio (Gemini) - GRÁTIS

## 🎯 Por que Gemini?

- ✅ **Totalmente GRÁTIS** (até 1500 requisições/dia)
- ✅ **Aceita PDF direto** (sem precisar extrair texto!)
- ✅ **Boa precisão** em português (90-95%)
- ✅ **Rápido** (~2-4 segundos)
- ✅ **JSON mode nativo**
- ✅ **Fácil de usar**

## 📝 Passo 1: Obter Chave de API

1. Acesse: https://aistudio.google.com/app/apikey
2. Clique em "Create API Key"
3. Copie a chave (começa com `AIza...`)
4. Guarde em `.env` ou variável de ambiente

## 💻 Passo 2: Implementação

### Arquivo: `src/services/contract-analysis.js`

```javascript
import axios from 'axios'

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent'

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
    // 1. Converte PDF para base64
    const pdfBase64 = await pdfToBase64(pdfFile)
    
    // 2. Monta o prompt
    const prompt = `
Você é um especialista em análise de contratos sociais brasileiros.

SÓCIOS ESPERADOS NO CONTRATO:
${socios.map(s => `- ${s.fullName} (CPF: ${s.cpf})`).join('\n')}

TAREFA:
Analise o contrato social em PDF e retorne APENAS um JSON válido com:

{
  "sociosPresentes": {
    "status": true ou false,
    "detalhes": "explicação",
    "peso": 30
  },
  "assinaturaValida": {
    "status": true ou false,
    "detalhes": "explicação",
    "peso": 25
  },
  "clausulasEssenciais": {
    "status": true ou false,
    "detalhes": "explicação",
    "peso": 25
  },
  "formatoValido": {
    "status": true ou false,
    "detalhes": "explicação",
    "peso": 20
  },
  "resumo": "resumo geral da análise"
}

CRITÉRIOS DE ANÁLISE:

1. Sócios Presentes (peso 30):
   - Verificar se TODOS os sócios listados acima aparecem no contrato
   - Buscar por nome completo e CPF
   - Status = true apenas se TODOS estiverem presentes

2. Assinatura Válida (peso 25):
   - Buscar por: "assinado digitalmente", "ICP-Brasil", "gov.br", "certificado digital"
   - Verificar se há assinaturas dos sócios
   - Status = true se houver evidência de assinatura válida

3. Cláusulas Essenciais (peso 25):
   - Verificar presença de: objeto social, capital social, administração, sede
   - Status = true se contiver pelo menos 3 dessas cláusulas

4. Formato Válido (peso 20):
   - Verificar se é um documento profissional
   - Sem erros grosseiros de português
   - Estrutura de contrato social (cláusulas numeradas)
   - Status = true se formato for adequado

Retorne APENAS o JSON, sem texto adicional.
`

    // 3. Faz requisição para Gemini
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
          maxOutputTokens: 1024,
        }
      }
    )
    
    // 4. Extrai o JSON da resposta
    const textoResposta = response.data.candidates[0].content.parts[0].text
    
    // Remove markdown se houver (```json ... ```)
    const jsonText = textoResposta.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    
    const analise = JSON.parse(jsonText)
    
    return analise
    
  } catch (error) {
    console.error('Erro ao analisar contrato:', error)
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
```

---

## 🔧 Passo 3: Configurar Variável de Ambiente

Crie o arquivo `.env` na raiz do projeto:

```env
VITE_GEMINI_API_KEY=AIzaSy...sua_chave_aqui
```

**IMPORTANTE**: Adicione `.env` no `.gitignore`:
```
.env
.env.local
```

---

## 🎨 Passo 4: Integrar no ContractView

```vue
<script setup>
import { validarContrato } from '@/services/contract-analysis'

const analisando = ref(false)
const resultadoAnalise = ref(null)

async function analisarContrato() {
  if (!pdfFile.value) return
  
  analisando.value = true
  errors.value = {}
  
  try {
    // Busca sócios do store
    const socios = store.partners
    
    // Analisa o contrato
    const resultado = await validarContrato(pdfFile.value, socios)
    
    resultadoAnalise.value = resultado
    
  } catch (error) {
    console.error('Erro:', error)
    errors.value.analise = 'Erro ao analisar contrato. Tente novamente.'
  } finally {
    analisando.value = false
  }
}

function handleSubmit() {
  errors.value = {}
  
  if (!pdfFile.value) {
    errors.value.file = 'Anexe o contrato social'
    return
  }
  
  if (!resultadoAnalise.value) {
    errors.value.analise = 'Analise o contrato antes de finalizar'
    return
  }
  
  if (!resultadoAnalise.value.aprovado) {
    errors.value.analise = `Contrato reprovado (${resultadoAnalise.value.indice}% de confiança)`
    return
  }
  
  // Finaliza cadastro
  uploading.value = true
  setTimeout(() => {
    store.clearStorage()
    router.push('/welcome')
  }, 1500)
}
</script>
```

---

## 🎨 Passo 5: UI do Resultado

```vue
<template>
  <!-- Após preview do PDF -->
  
  <!-- Botão Analisar -->
  <button
    v-if="pdfFile && !resultadoAnalise"
    @click="analisarContrato"
    class="btn btn-outline-primary w-100 py-3 mt-3"
    :disabled="analisando"
  >
    <span v-if="!analisando">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="me-2">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
      </svg>
      Analisar Contrato com IA
    </span>
    <span v-else>
      <span class="spinner-border spinner-border-sm me-2"></span>
      Analisando contrato...
    </span>
  </button>
  
  <!-- Resultado da Análise -->
  <div v-if="resultadoAnalise" class="analise-card mt-4">
    <!-- Header do Resultado -->
    <div class="analise-header" :class="resultadoAnalise.aprovado ? 'approved' : 'rejected'">
      <div class="result-badge">
        <span class="badge-icon">{{ resultadoAnalise.aprovado ? '✓' : '✗' }}</span>
        <span class="badge-text">
          {{ resultadoAnalise.aprovado ? 'Contrato Aprovado' : 'Contrato Reprovado' }}
        </span>
      </div>
    </div>
    
    <!-- Índice de Confiança -->
    <div class="confidence-section">
      <div class="confidence-label">Índice de Confiança</div>
      <div class="progress" style="height: 24px;">
        <div
          class="progress-bar"
          :class="'bg-' + resultadoAnalise.cor"
          :style="{ width: resultadoAnalise.indice + '%' }"
        >
          <strong>{{ resultadoAnalise.indice }}%</strong>
        </div>
      </div>
      <small class="text-muted">Nível: {{ resultadoAnalise.nivel }}</small>
    </div>

    
    <!-- Critérios Avaliados -->
    <div class="criterios-section mt-3">
      <div class="criterio-item" :class="resultadoAnalise.sociosPresentes?.status ? 'valid' : 'invalid'">
        <span class="criterio-icon">
          {{ resultadoAnalise.sociosPresentes?.status ? '✓' : '✗' }}
        </span>
        <div class="criterio-content">
          <div class="criterio-title">Sócios Presentes</div>
          <small class="criterio-detail">{{ resultadoAnalise.sociosPresentes?.detalhes }}</small>
        </div>
      </div>
      
      <div class="criterio-item" :class="resultadoAnalise.assinaturaValida?.status ? 'valid' : 'invalid'">
        <span class="criterio-icon">
          {{ resultadoAnalise.assinaturaValida?.status ? '✓' : '✗' }}
        </span>
        <div class="criterio-content">
          <div class="criterio-title">Assinatura Válida</div>
          <small class="criterio-detail">{{ resultadoAnalise.assinaturaValida?.detalhes }}</small>
        </div>
      </div>
      
      <div class="criterio-item" :class="resultadoAnalise.clausulasEssenciais?.status ? 'valid' : 'invalid'">
        <span class="criterio-icon">
          {{ resultadoAnalise.clausulasEssenciais?.status ? '✓' : '✗' }}
        </span>
        <div class="criterio-content">
          <div class="criterio-title">Cláusulas Essenciais</div>
          <small class="criterio-detail">{{ resultadoAnalise.clausulasEssenciais?.detalhes }}</small>
        </div>
      </div>
      
      <div class="criterio-item" :class="resultadoAnalise.formatoValido?.status ? 'valid' : 'invalid'">
        <span class="criterio-icon">
          {{ resultadoAnalise.formatoValido?.status ? '✓' : '✗' }}
        </span>
        <div class="criterio-content">
          <div class="criterio-title">Formato Válido</div>
          <small class="criterio-detail">{{ resultadoAnalise.formatoValido?.detalhes }}</small>
        </div>
      </div>
    </div>
    
    <!-- Resumo -->
    <div class="resumo-section mt-3">
      <p class="mb-0">{{ resultadoAnalise.resumo }}</p>
    </div>
  </div>
  
  <!-- Erro de análise -->
  <small class="text-danger d-block mt-2" v-if="errors.analise">{{ errors.analise }}</small>
  
  <!-- Botão Finalizar (só aparece se aprovado) -->
  <button
    v-if="resultadoAnalise?.aprovado"
    @click="handleSubmit"
    class="btn btn-gradient w-100 py-3 mt-4"
    :disabled="uploading"
  >
    <span v-if="!uploading">Finalizar Cadastro</span>
    <span v-else>
      <span class="spinner-border spinner-border-sm me-2"></span>
      Finalizando...
    </span>
  </button>
</template>
```

---

## 🎨 Passo 6: CSS para o Resultado

```css
/* Card de Análise */
.analise-card {
  border: 2px solid #E2E8F0;
  border-radius: 12px;
  overflow: hidden;
  background-color: #F8F9FA;
}

.analise-header {
  padding: 1rem;
  text-align: center;
}

.analise-header.approved {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(0, 201, 177, 0.1));
  border-bottom: 2px solid #10B981;
}

.analise-header.rejected {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.1));
  border-bottom: 2px solid #EF4444;
}

.result-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.badge-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
}

.approved .badge-icon {
  background-color: #10B981;
  color: white;
}

.rejected .badge-icon {
  background-color: #EF4444;
  color: white;
}

.badge-text {
  font-size: 1.1rem;
  font-weight: 700;
}

.approved .badge-text {
  color: #10B981;
}

.rejected .badge-text {
  color: #EF4444;
}

/* Seção de Confiança */
.confidence-section {
  padding: 1rem;
  background-color: white;
}

.confidence-label {
  font-size: 0.85rem;
  color: #6B7280;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

/* Critérios */
.criterios-section {
  padding: 0 1rem 1rem;
  background-color: white;
}

.criterio-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

.criterio-item.valid {
  background-color: rgba(16, 185, 129, 0.05);
  border-left: 3px solid #10B981;
}

.criterio-item.invalid {
  background-color: rgba(239, 68, 68, 0.05);
  border-left: 3px solid #EF4444;
}

.criterio-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}

.valid .criterio-icon {
  background-color: #10B981;
  color: white;
}

.invalid .criterio-icon {
  background-color: #EF4444;
  color: white;
}

.criterio-content {
  flex: 1;
}

.criterio-title {
  font-weight: 600;
  color: #251848;
  font-size: 0.95rem;
  margin-bottom: 0.25rem;
}

.criterio-detail {
  color: #6B7280;
  font-size: 0.85rem;
  line-height: 1.4;
}

/* Resumo */
.resumo-section {
  padding: 1rem;
  background-color: rgba(0, 201, 177, 0.05);
  border-top: 1px solid #E2E8F0;
  font-size: 0.9rem;
  color: #251848;
  line-height: 1.5;
}
```

---

## 📦 Passo 7: Instalar Dependência

```bash
npm install axios
```

(Axios já está instalado no projeto)

---

## 🧪 Passo 8: Testar

### Teste 1: Contrato Válido
- Upload de um contrato social real
- Verificar se todos os sócios são encontrados
- Índice deve ser >= 70%

### Teste 2: Contrato Inválido
- Upload de um PDF qualquer (não-contrato)
- Índice deve ser < 70%
- Cadastro deve ser bloqueado

### Teste 3: Contrato Parcial
- Contrato sem assinatura
- Índice entre 50-70%
- Verificar feedback específico

---

## 🔐 Segurança

### ⚠️ IMPORTANTE:
A chave de API no `.env` ainda fica exposta no frontend (Vite injeta no build).

### Solução Ideal (Produção):
Criar backend proxy simples:

```javascript
// backend/server.js (Node.js + Express)
const express = require('express')
const axios = require('axios')
const app = express()

app.use(express.json({ limit: '10mb' }))

app.post('/api/analyze-contract', async (req, res) => {
  const { pdfBase64, socios } = req.body
  
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [/* ... */] }]
      }
    )
    
    res.json(response.data)
  } catch (error) {
    res.status(500).json({ error: 'Erro na análise' })
  }
})

app.listen(3000)
```

### Para o Protótipo:
Pode usar `.env` direto (apenas não commitar a chave!)

---

## 📊 Exemplo de Resposta do Gemini

```json
{
  "sociosPresentes": {
    "status": true,
    "detalhes": "Todos os 3 sócios foram encontrados no contrato: João Silva, Maria Santos, Pedro Costa",
    "peso": 30
  },
  "assinaturaValida": {
    "status": true,
    "detalhes": "Contrato possui assinatura digital ICP-Brasil válida",
    "peso": 25
  },
  "clausulasEssenciais": {
    "status": true,
    "detalhes": "Contém: objeto social (cláusula 2), capital social (cláusula 3), administração (cláusula 5), sede (cláusula 1)",
    "peso": 25
  },
  "formatoValido": {
    "status": true,
    "detalhes": "Documento profissional, estrutura adequada, sem erros grosseiros",
    "peso": 20
  },
  "resumo": "Contrato social válido e completo. Todos os critérios foram atendidos.",
  "indice": 100,
  "aprovado": true,
  "nivel": "Alto",
  "cor": "success"
}
```

---

## ✅ Checklist de Implementação

- [ ] Obter chave de API do Google AI Studio
- [ ] Criar arquivo `.env` com a chave
- [ ] Adicionar `.env` no `.gitignore`
- [ ] Criar `src/services/contract-analysis.js`
- [ ] Implementar `pdfToBase64()`
- [ ] Implementar `analisarContratoComGemini()`
- [ ] Implementar `calcularIndiceConfianca()`
- [ ] Implementar `validarContrato()`
- [ ] Atualizar `ContractView.vue`
- [ ] Adicionar botão "Analisar Contrato"
- [ ] Adicionar card de resultado
- [ ] Adicionar CSS do resultado
- [ ] Bloquear finalização se reprovado
- [ ] Testar com contrato real
- [ ] Testar com PDF inválido
- [ ] Documentar no README

---

## 🎯 Vantagens do Gemini para este Projeto

1. **Grátis**: 1500 requisições/dia (mais que suficiente)
2. **PDF Direto**: Não precisa de OCR ou extração de texto
3. **Rápido**: ~2-4 segundos de análise
4. **Português**: Ótima compreensão de documentos BR
5. **JSON Mode**: Retorna estrutura consistente
6. **Fácil**: API simples, poucos parâmetros

---

## 🚀 Tempo Estimado de Implementação

- **Criar serviço**: ~30 minutos
- **Integrar no ContractView**: ~30 minutos
- **Adicionar UI do resultado**: ~30 minutos
- **Testar e ajustar**: ~30 minutos

**Total**: ~2 horas

---

## 📚 Links Úteis

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Gemini Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)
- [File Upload Guide](https://ai.google.dev/gemini-api/docs/vision)

---

## 💡 Dica Final

O Gemini aceita PDF direto na API, então você pode pular toda a parte de extração de texto com PDF.js ou Tesseract.js. Isso simplifica MUITO a implementação!

Basta:
1. Converter PDF para base64
2. Enviar para Gemini com o prompt
3. Receber análise em JSON
4. Calcular índice de confiança
5. Mostrar resultado visual

Simples, rápido e grátis! 🎉
