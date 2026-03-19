# Opções para Implementação do Requisito 8 - IA para Análise de Contrato

## 📋 Objetivo do Requisito

Integrar IA (LLM) na última etapa do onboarding para analisar o contrato social da empresa e validar:

1. ✅ Se todos os sócios informados estão presentes no contrato
2. ✅ Se o contrato possui assinatura válida (digital ou gov.br)
3. ✅ Se o contrato possui cláusulas essenciais de um contrato social
4. ✅ Se não há erros grosseiros
5. ✅ Calcular índice de confiança usando lógica fuzzy
6. ✅ Reprovar cadastro se índice for baixo

---

## 🎯 Abordagens Possíveis

### **OPÇÃO 1: PDF.js + OpenAI GPT-4** (Recomendada)
**Complexidade**: Média  
**Custo**: ~$0.01 por análise  
**Precisão**: Alta (95%+)

#### Stack:
- **PDF.js** (Mozilla) - Extração de texto do PDF
- **OpenAI GPT-4 Turbo** - Análise inteligente do contrato

#### Vantagens:
- ✅ PDF.js é nativo do navegador (sem backend)
- ✅ GPT-4 tem excelente compreensão de documentos jurídicos
- ✅ API simples e bem documentada
- ✅ Suporta structured outputs (JSON)
- ✅ Boa performance (~3-5 segundos)

#### Desvantagens:
- ❌ Requer chave de API (custo por uso)
- ❌ Precisa de backend proxy para esconder a chave
- ❌ Dependência de serviço externo

#### Implementação:
```javascript
// 1. Extrair texto do PDF
import * as pdfjsLib from 'pdfjs-dist'

async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  let fullText = ''
  
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n'
  }
  
  return fullText
}

// 2. Analisar com GPT-4
async function analisarContrato(textoContrato, socios) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4-turbo',
      messages: [
        {
          role: 'system',
          content: 'Você é um especialista em análise de contratos sociais brasileiros.'
        },
        {
          role: 'user',
          content: `Analise este contrato social e retorne um JSON com:
          
          Sócios esperados: ${JSON.stringify(socios)}
          
          Contrato:
          ${textoContrato}
          
          Retorne JSON:
          {
            "sociosPresentes": true/false,
            "assinaturaValida": true/false,
            "clausulasEssenciais": true/false,
            "errosGrosseiros": true/false,
            "indiceConfianca": 0-100,
            "detalhes": "explicação"
          }`
        }
      ],
      response_format: { type: 'json_object' }
    })
  })
  
  return await response.json()
}
```

---

### **OPÇÃO 2: Tesseract.js + Claude API** (Alternativa)
**Complexidade**: Média-Alta  
**Custo**: ~$0.015 por análise  
**Precisão**: Muito Alta (98%+)

#### Stack:
- **Tesseract.js** - OCR para PDFs escaneados
- **Claude 3.5 Sonnet** (Anthropic) - Análise de documentos

#### Vantagens:
- ✅ Tesseract funciona no navegador
- ✅ Claude tem excelente análise de documentos longos
- ✅ Suporta até 200k tokens (contratos grandes)
- ✅ Melhor compreensão de contexto jurídico

#### Desvantagens:
- ❌ Tesseract é lento (~10-30 segundos para OCR)
- ❌ Requer backend proxy para API
- ❌ Custo um pouco maior

#### Implementação:
```javascript
import Tesseract from 'tesseract.js'

async function extractTextWithOCR(file) {
  const { data: { text } } = await Tesseract.recognize(
    file,
    'por', // português
    {
      logger: m => console.log(m) // progresso
    }
  )
  return text
}
```

---

### **OPÇÃO 3: PDF.js + Backend com LLM Local** (Avançada)
**Complexidade**: Alta  
**Custo**: Grátis (após setup)  
**Precisão**: Média-Alta (85-90%)

#### Stack:
- **PDF.js** - Extração de texto
- **Ollama + Llama 3** - LLM local no backend
- **Node.js/Python** - API intermediária

#### Vantagens:
- ✅ Sem custo de API
- ✅ Privacidade total (dados não saem do servidor)
- ✅ Sem limite de requisições

#### Desvantagens:
- ❌ Requer servidor com GPU
- ❌ Setup complexo
- ❌ Precisão menor que GPT-4/Claude
- ❌ Mais lento (~10-20 segundos)

---

### **OPÇÃO 4: PDF.js + Gemini API** (Econômica)
**Complexidade**: Baixa  
**Custo**: Grátis (até 60 req/min)  
**Precisão**: Alta (90-95%)

#### Stack:
- **PDF.js** - Extração de texto
- **Google Gemini 1.5 Flash** - Análise gratuita

#### Vantagens:
- ✅ API gratuita com limite generoso
- ✅ Rápida (~2-3 segundos)
- ✅ Boa compreensão de português
- ✅ Suporta JSON mode

#### Desvantagens:
- ❌ Limite de 60 requisições por minuto
- ❌ Requer chave de API
- ❌ Precisa de backend proxy

#### Implementação:
```javascript
async function analisarComGemini(textoContrato, socios) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Analise este contrato social brasileiro...`
          }]
        }],
        generationConfig: {
          response_mime_type: 'application/json'
        }
      })
    }
  )
  
  return await response.json()
}
```

---

## 🏆 Recomendação: OPÇÃO 1 (PDF.js + OpenAI GPT-4)

### Por quê?
1. **Melhor custo-benefício** para protótipo
2. **Implementação mais simples** (menos código)
3. **Alta precisão** em análise jurídica
4. **Rápida** (3-5 segundos total)
5. **Bem documentada** (muitos exemplos)

### Arquitetura Proposta:

```
┌─────────────────┐
│  ContractView   │
│   (Frontend)    │
└────────┬────────┘
         │
         │ 1. Upload PDF
         ▼
┌─────────────────┐
│    PDF.js       │
│ (Extrai texto)  │
└────────┬────────┘
         │
         │ 2. Texto extraído
         ▼
┌─────────────────┐
│  Backend Proxy  │
│   (Node.js)     │
└────────┬────────┘
         │
         │ 3. Envia para OpenAI
         ▼
┌─────────────────┐
│   OpenAI API    │
│   (GPT-4)       │
└────────┬────────┘
         │
         │ 4. Análise JSON
         ▼
┌─────────────────┐
│  ContractView   │
│ (Mostra result) │
└─────────────────┘
```

---

## 📝 Estrutura do Prompt para LLM

```javascript
const prompt = `
Você é um especialista em análise de contratos sociais brasileiros.

SÓCIOS ESPERADOS:
${JSON.stringify(socios, null, 2)}

CONTRATO SOCIAL:
${textoContrato}

TAREFA:
Analise o contrato e retorne um JSON com a seguinte estrutura:

{
  "sociosPresentes": {
    "status": true/false,
    "detalhes": "Todos os sócios foram encontrados" ou "Faltam: João Silva",
    "peso": 30
  },
  "assinaturaValida": {
    "status": true/false,
    "detalhes": "Assinatura digital encontrada" ou "Sem assinatura válida",
    "peso": 25
  },
  "clausulasEssenciais": {
    "status": true/false,
    "detalhes": "Contém: objeto social, capital social, administração",
    "peso": 25
  },
  "formatoValido": {
    "status": true/false,
    "detalhes": "Formato profissional, sem erros grosseiros",
    "peso": 20
  },
  "indiceConfianca": 85,
  "aprovado": true/false,
  "resumo": "Contrato válido com todas as informações necessárias"
}

CRITÉRIOS:
- Sócios: Verificar se TODOS os sócios informados aparecem no contrato
- Assinatura: Buscar por "assinado digitalmente", "ICP-Brasil", "gov.br"
- Cláusulas: Objeto social, capital social, administração, sede
- Formato: Estrutura profissional, sem erros de português

LÓGICA FUZZY:
indiceConfianca = (sociosPresentes.peso × status) + 
                  (assinaturaValida.peso × status) + 
                  (clausulasEssenciais.peso × status) + 
                  (formatoValido.peso × status)

APROVAÇÃO:
- indiceConfianca >= 70: APROVADO
- indiceConfianca < 70: REPROVADO
`
```

---

## 🔧 Implementação Sugerida

### Arquivos a criar:

1. **`src/services/contract-analysis.js`**
   - `extractTextFromPDF(file)` - Extrai texto com PDF.js
   - `analisarContrato(texto, socios)` - Envia para LLM
   - `calcularIndiceConfianca(resultado)` - Lógica fuzzy
   - `validarContrato(file, socios)` - Função completa

2. **Backend Proxy** (opcional, mas recomendado)
   - `POST /api/analyze-contract` - Recebe texto e sócios
   - Chama OpenAI com chave segura
   - Retorna análise JSON

3. **Atualizar `ContractView.vue`**
   - Adicionar botão "Analisar Contrato"
   - Mostrar loading durante análise
   - Exibir resultado visual (aprovado/reprovado)
   - Mostrar breakdown dos critérios
   - Permitir finalizar apenas se aprovado

---

## 💰 Estimativa de Custos

### OpenAI GPT-4 Turbo:
- **Input**: ~$0.01 por 1k tokens
- **Output**: ~$0.03 por 1k tokens
- **Contrato médio**: ~2k tokens input + 500 tokens output
- **Custo por análise**: ~$0.035 (R$ 0,18)

### Google Gemini 1.5 Flash:
- **Grátis**: até 60 requisições/minuto
- **Custo por análise**: R$ 0,00

### Claude 3.5 Sonnet:
- **Input**: ~$0.003 por 1k tokens
- **Output**: ~$0.015 por 1k tokens
- **Custo por análise**: ~$0.015 (R$ 0,08)

---

## 🚀 Fluxo de Implementação Recomendado

### Fase 1: Extração de Texto (Frontend)
```javascript
// src/services/contract-analysis.js
import * as pdfjsLib from 'pdfjs-dist'

export async function extractTextFromPDF(file) {
  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise
  
  let fullText = ''
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const textContent = await page.getTextContent()
    const pageText = textContent.items.map(item => item.str).join(' ')
    fullText += pageText + '\n\n'
  }
  
  return fullText
}
```

### Fase 2: Análise com IA (Backend ou Frontend)
```javascript
export async function analisarContrato(textoContrato, socios) {
  // Opção A: Chamar backend proxy
  const response = await fetch('/api/analyze-contract', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      texto: textoContrato,
      socios: socios
    })
  })
  
  return await response.json()
}
```

### Fase 3: Lógica Fuzzy (Frontend)
```javascript
export function calcularIndiceConfianca(analise) {
  const pesos = {
    sociosPresentes: 30,
    assinaturaValida: 25,
    clausulasEssenciais: 25,
    formatoValido: 20
  }
  
  let indice = 0
  
  if (analise.sociosPresentes.status) indice += pesos.sociosPresentes
  if (analise.assinaturaValida.status) indice += pesos.assinaturaValida
  if (analise.clausulasEssenciais.status) indice += pesos.clausulasEssenciais
  if (analise.formatoValido.status) indice += pesos.formatoValido
  
  return {
    indice,
    aprovado: indice >= 70,
    nivel: indice >= 85 ? 'Alto' : indice >= 70 ? 'Médio' : 'Baixo'
  }
}
```

### Fase 4: Integração no ContractView
```vue
<script setup>
import { extractTextFromPDF, analisarContrato, calcularIndiceConfianca } from '@/services/contract-analysis'

const analisando = ref(false)
const resultadoAnalise = ref(null)

async function analisarContratoSocial() {
  if (!pdfFile.value) return
  
  analisando.value = true
  
  try {
    // 1. Extrai texto do PDF
    const texto = await extractTextFromPDF(pdfFile.value)
    
    // 2. Busca sócios do store
    const socios = store.partners.map(p => ({
      nome: p.fullName,
      cpf: p.cpf
    }))
    
    // 3. Envia para análise
    const analise = await analisarContrato(texto, socios)
    
    // 4. Calcula índice de confiança
    const resultado = calcularIndiceConfianca(analise)
    
    resultadoAnalise.value = {
      ...analise,
      ...resultado
    }
    
  } catch (error) {
    console.error('Erro na análise:', error)
    alert('Erro ao analisar contrato. Tente novamente.')
  } finally {
    analisando.value = false
  }
}

function handleSubmit() {
  if (!resultadoAnalise.value) {
    errors.value.analise = 'Analise o contrato antes de finalizar'
    return
  }
  
  if (!resultadoAnalise.value.aprovado) {
    errors.value.analise = 'Contrato reprovado. Verifique os detalhes.'
    return
  }
  
  // Prossegue com finalização
  store.clearStorage()
  router.push('/welcome')
}
</script>

<template>
  <!-- Após o preview do PDF -->
  
  <!-- Botão de Análise -->
  <button
    v-if="pdfFile && !resultadoAnalise"
    @click="analisarContratoSocial"
    class="btn btn-outline-primary w-100 py-3 mt-3"
    :disabled="analisando"
  >
    <span v-if="!analisando">🤖 Analisar Contrato com IA</span>
    <span v-else>
      <span class="spinner-border spinner-border-sm me-2"></span>
      Analisando...
    </span>
  </button>
  
  <!-- Resultado da Análise -->
  <div v-if="resultadoAnalise" class="analise-result mt-4">
    <div class="result-header" :class="resultadoAnalise.aprovado ? 'approved' : 'rejected'">
      <span class="result-icon">
        {{ resultadoAnalise.aprovado ? '✓' : '✗' }}
      </span>
      <span class="result-text">
        {{ resultadoAnalise.aprovado ? 'Contrato Aprovado' : 'Contrato Reprovado' }}
      </span>
    </div>
    
    <div class="confidence-bar">
      <div class="confidence-label">Índice de Confiança</div>
      <div class="progress">
        <div
          class="progress-bar"
          :class="resultadoAnalise.aprovado ? 'bg-success' : 'bg-danger'"
          :style="{ width: resultadoAnalise.indice + '%' }"
        >
          {{ resultadoAnalise.indice }}%
        </div>
      </div>
    </div>
    
    <div class="criterios mt-3">
      <div class="criterio-item">
        <span>{{ resultadoAnalise.sociosPresentes.status ? '✓' : '✗' }}</span>
        <span>Sócios Presentes</span>
      </div>
      <div class="criterio-item">
        <span>{{ resultadoAnalise.assinaturaValida.status ? '✓' : '✗' }}</span>
        <span>Assinatura Válida</span>
      </div>
      <div class="criterio-item">
        <span>{{ resultadoAnalise.clausulasEssenciais.status ? '✓' : '✗' }}</span>
        <span>Cláusulas Essenciais</span>
      </div>
      <div class="criterio-item">
        <span>{{ resultadoAnalise.formatoValido.status ? '✓' : '✗' }}</span>
        <span>Formato Válido</span>
      </div>
    </div>
    
    <div class="detalhes mt-3">
      <small class="text-muted">{{ resultadoAnalise.resumo }}</small>
    </div>
  </div>
  
  <!-- Botão Finalizar (só aparece se aprovado) -->
  <button
    v-if="resultadoAnalise?.aprovado"
    @click="handleSubmit"
    class="btn btn-gradient w-100 py-3 mt-4"
  >
    Finalizar Cadastro
  </button>
</template>
```

---

## 📦 Dependências Necessárias

### Para PDF.js:
```bash
npm install pdfjs-dist
```

### Para Tesseract.js (se usar OCR):
```bash
npm install tesseract.js
```

### Para Axios (já instalado):
```bash
npm install axios
```

---

## 🎨 Exemplo de UI para Resultado

```
┌─────────────────────────────────────┐
│  ✓ Contrato Aprovado                │
│                                     │
│  Índice de Confiança                │
│  ████████████████░░░░  85%          │
│                                     │
│  ✓ Sócios Presentes                 │
│  ✓ Assinatura Válida                │
│  ✓ Cláusulas Essenciais             │
│  ✓ Formato Válido                   │
│                                     │
│  Contrato válido com todas as       │
│  informações necessárias.           │
│                                     │
│  [Finalizar Cadastro]               │
└─────────────────────────────────────┘
```

---

## ⚠️ Considerações Importantes

### Segurança:
- **NUNCA** exponha chaves de API no frontend
- Use backend proxy para chamadas à LLM
- Valide tamanho do arquivo antes de processar
- Limite taxa de requisições (rate limiting)

### Performance:
- PDF.js é rápido (~1-2 segundos)
- LLM pode demorar 3-10 segundos
- Mostre loading com progresso
- Cache resultado da análise

### Privacidade:
- Contratos contêm dados sensíveis
- Considere usar LLM local em produção
- Ou use APIs com garantia de não-treinamento (OpenAI tem opção)

### Fallback:
- Se API falhar, permitir prosseguir com aviso
- Ou implementar análise manual (admin)

---

## 🎯 Próximos Passos Sugeridos

1. **Decidir qual opção usar** (recomendo Opção 1 ou 4)
2. **Criar backend proxy simples** (Node.js/Express)
3. **Implementar extração de texto** (PDF.js)
4. **Criar serviço de análise** (`contract-analysis.js`)
5. **Integrar no ContractView** (botão + resultado visual)
6. **Testar com contratos reais** (validar precisão)
7. **Ajustar pesos da lógica fuzzy** (se necessário)

---

## 📚 Recursos Úteis

- [PDF.js Documentation](https://mozilla.github.io/pdf.js/)
- [OpenAI API Docs](https://platform.openai.com/docs)
- [Gemini API Docs](https://ai.google.dev/docs)
- [Tesseract.js GitHub](https://github.com/naptha/tesseract.js)

---

## 💡 Dica Final

Para o protótipo/desafio, você pode:
1. **Implementar apenas a extração de texto** (PDF.js)
2. **Simular a análise da IA** com regras simples (busca por palavras-chave)
3. **Mostrar a UI completa** do resultado
4. **Explicar no README** como seria a integração real

Isso demonstra conhecimento da arquitetura sem precisar de chave de API ou backend.
