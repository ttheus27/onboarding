<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding.js'
import { validarContrato } from '../services/contract-analysis.js'
import Logo from '../assets/Logo.png'

const router = useRouter()
const store = useOnboardingStore()

const pdfFile = ref(null)
const pdfUrl = ref('')
const fileName = ref('')
const fileSize = ref(0)
const errors = ref({})
const uploading = ref(false)
const analisando = ref(false)
const resultadoAnalise = ref(null)

onMounted(() => {
  store.loadFromStorage()
})

function handleFileSelect(event) {
  const file = event.target.files[0]
  processFile(file)
}

function handleDrop(event) {
  event.preventDefault()
  const file = event.dataTransfer.files[0]
  processFile(file)
}

function handleDragOver(event) {
  event.preventDefault()
}

function processFile(file) {
  errors.value = {}
  
  if (!file) return
  
  // Valida se é PDF
  if (file.type !== 'application/pdf') {
    errors.value.file = 'Apenas arquivos PDF são permitidos'
    return
  }
  
  // Valida tamanho (máximo 10MB)
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (file.size > maxSize) {
    errors.value.file = 'Arquivo muito grande. Máximo 10MB'
    return
  }
  
  pdfFile.value = file
  fileName.value = file.name
  fileSize.value = (file.size / 1024 / 1024).toFixed(2) // MB
  
  // Cria URL para preview
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
  pdfUrl.value = URL.createObjectURL(file)
}

function removeFile() {
  if (pdfUrl.value) {
    URL.revokeObjectURL(pdfUrl.value)
  }
  pdfFile.value = null
  pdfUrl.value = ''
  fileName.value = ''
  fileSize.value = 0
  errors.value = {}
  resultadoAnalise.value = null
}

async function analisarContrato() {
  if (!pdfFile.value) return
  
  analisando.value = true
  errors.value = {}
  
  try {
    // Busca sócios do store
    const socios = store.partners
    
    if (!socios || socios.length === 0) {
      errors.value.analise = 'Nenhum sócio cadastrado. Volte e cadastre os sócios.'
      return
    }
    
    // Analisa o contrato
    const resultado = await validarContrato(pdfFile.value, socios)
    
    resultadoAnalise.value = resultado
    
  } catch (error) {
    console.error('Erro:', error)
    errors.value.analise = error.message || 'Erro ao analisar contrato. Tente novamente.'
  } finally {
    analisando.value = false
  }
}

function handleSubmit() {
  errors.value = {}
  
  if (!pdfFile.value) {
    errors.value.file = 'Anexe o contrato social da empresa'
    return
  }
  
  if (!resultadoAnalise.value) {
    errors.value.analise = 'Analise o contrato antes de finalizar'
    return
  }
  
  if (!resultadoAnalise.value.aprovado) {
    errors.value.analise = `Contrato reprovado (${resultadoAnalise.value.indice}% de confiança). Verifique os critérios abaixo.`
    return
  }
  
  uploading.value = true
  
  // Simula upload (em produção, enviaria para API)
  setTimeout(() => {
    uploading.value = false
    store.clearStorage() // Limpa cache ao finalizar
    router.push('/welcome') // Redireciona para tela de boas-vindas
  }, 2000)
}

function goBack() {
  router.push('/partners')
}
</script>

<template>
  <!-- Header (fora do container) -->
  <header class="register-header d-flex align-items-center justify-content-between px-4 py-3">
    <button @click="goBack" class="btn-back">← Voltar</button>
    <div class="logo d-flex align-items-center gap-2">
      <img :src="Logo" alt="Logo" class="logo-image" />
      <span class="logo-text">TransferCripto</span>
    </div>
    <div class="menu-icon">☰</div>
  </header>

  <!-- Steps (fora do container) -->
  <div class="steps-container px-4 pt-3 pb-2">
    <div class="d-flex align-items-center justify-content-center gap-0">
      <div class="step completed">
        <div class="step-circle">✓</div>
        <span class="step-label">Empresa</span>
      </div>
      <div class="step-line active"></div>
      <div class="step completed">
        <div class="step-circle">✓</div>
        <span class="step-label">Sócios</span>
      </div>
      <div class="step-line active"></div>
      <div class="step active">
        <div class="step-circle">3</div>
        <span class="step-label">Contrato</span>
      </div>
    </div>
  </div>

  <!-- Conteúdo (dentro do container centralizado) -->
  <div class="contract-page">
    <div class="form-container px-4 pb-5">
      <h2 class="form-title mt-3 mb-1">Contrato Social</h2>
      <p class="form-subtitle mb-4">
        Anexe o contrato social da empresa em formato PDF para validação.
      </p>

      <!-- Upload Area -->
      <div v-if="!pdfFile" class="upload-section">
        <div
          class="drop-zone"
          @drop="handleDrop"
          @dragover="handleDragOver"
        >
          <input
            type="file"
            accept="application/pdf"
            @change="handleFileSelect"
            id="pdfInput"
            style="display: none"
          />
          <label for="pdfInput" class="drop-zone-content">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16" class="mb-3">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            <h5 class="mb-2">Clique ou arraste o PDF aqui</h5>
            <p class="text-muted mb-0">Apenas arquivos PDF • Máximo 10MB</p>
          </label>
        </div>
        <small class="text-danger d-block mt-2" v-if="errors.file">{{ errors.file }}</small>
      </div>

      <!-- Preview Area -->
      <div v-else class="preview-section">
        <!-- Info do arquivo -->
        <div class="file-info mb-3">
          <div class="d-flex align-items-center justify-content-between">
            <div class="d-flex align-items-center gap-3">
              <div class="file-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M14 4.5V14a2 2 0 0 1-2 2h-1v-1h1a1 1 0 0 0 1-1V4.5h-2A1.5 1.5 0 0 1 9.5 3V1H4a1 1 0 0 0-1 1v9H2V2a2 2 0 0 1 2-2h5.5L14 4.5ZM1.6 11.85H0v3.999h.791v-1.342h.803c.287 0 .531-.057.732-.173.203-.117.358-.275.463-.474a1.42 1.42 0 0 0 .161-.677c0-.25-.053-.476-.158-.677a1.176 1.176 0 0 0-.46-.477c-.2-.12-.443-.179-.732-.179Zm.545 1.333a.795.795 0 0 1-.085.38.574.574 0 0 1-.238.241.794.794 0 0 1-.375.082H.788V12.48h.66c.218 0 .389.06.512.181.123.122.185.296.185.522Zm1.217-1.333v3.999h1.46c.401 0 .734-.08.998-.237a1.45 1.45 0 0 0 .595-.689c.13-.3.196-.662.196-1.084 0-.42-.065-.778-.196-1.075a1.426 1.426 0 0 0-.589-.68c-.264-.156-.599-.234-1.005-.234H3.362Zm.791.645h.563c.248 0 .45.05.609.152a.89.89 0 0 1 .354.454c.079.201.118.452.118.753a2.3 2.3 0 0 1-.068.592 1.14 1.14 0 0 1-.196.422.8.8 0 0 1-.334.252 1.298 1.298 0 0 1-.483.082h-.563v-2.707Zm3.743 1.763v1.591h-.79V11.85h2.548v.653H7.896v1.117h1.606v.638H7.896Z"/>
                </svg>
              </div>
              <div>
                <div class="file-name">{{ fileName }}</div>
                <div class="file-size">{{ fileSize }} MB</div>
              </div>
            </div>
            <button type="button" @click="removeFile" class="btn-remove-file">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5Zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6Z"/>
                <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1ZM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118ZM2.5 3h11V2h-11v1Z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Preview do PDF -->
        <div class="pdf-preview">
          <iframe
            :src="pdfUrl"
            type="application/pdf"
            width="100%"
            height="600px"
            style="border: none; border-radius: 8px;"
          ></iframe>
        </div>
      </div>

      <!-- Botão Analisar -->
      <button
        v-if="pdfFile && !resultadoAnalise"
        @click="analisarContrato"
        class="btn btn-outline-primary w-100 py-3 mt-3"
        :disabled="analisando"
      >
        <span v-if="!analisando">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16" class="me-2" style="vertical-align: text-bottom;">
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

      <!-- Botão Finalizar -->
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

      <!-- Botão Finalizar (desabilitado se não analisou ou reprovado) -->
      <button
        v-if="pdfFile && !resultadoAnalise?.aprovado"
        @click="handleSubmit"
        class="btn btn-gradient w-100 py-3 mt-4"
        disabled
        style="opacity: 0.5; cursor: not-allowed;"
      >
        {{ !resultadoAnalise ? 'Analise o contrato para continuar' : 'Contrato Reprovado' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* Header e Steps ocupam 100% da largura */
.register-header,
.steps-container {
  width: 100vw;
  max-width: 100vw;
  margin: 0;
  padding-left: 1rem;
  padding-right: 1rem;
  box-sizing: border-box;
}

.register-header {
  background-color: #1A1035;
  border-bottom: 1px solid #E2E8F0;
}

.steps-container { 
  background-color: #E2E8F0; 
}

/* Container do formulário centralizado */
.contract-page {
  min-height: calc(100vh - 140px);
  background-color: #FFFFFF;
  color: #1A1A2E;
  margin: 0 auto;
}

/* Formulário centralizado com max-width */
.form-container {
  max-width: 480px;
  margin: 0 auto;
}

/* Responsivo para Tablet */
@media (min-width: 768px) {
  .form-container {
    max-width: 720px;
    padding: 2rem 3rem !important;
  }
}

/* Responsivo para Desktop */
@media (min-width: 1024px) {
  .form-container {
    max-width: 960px;
    padding: 2.5rem 4rem !important;
  }
}

/* Responsivo para Wide Screen */
@media (min-width: 1440px) {
  .form-container {
    max-width: 1400px;
    padding: 3rem 5rem !important;
  }
}

/* Responsivo para Ultra Wide */
@media (min-width: 1920px) {
  .form-container {
    max-width: 1600px;
    padding: 3rem 6rem !important;
  }
}

.btn-back {
  background: none;
  border: none;
  color: #F1F5F9;
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0;
}

.btn-back:hover {
  color: #00C9B1;
}

.logo-image {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.logo-text {
  font-weight: 700;
  font-size: 1.1rem;
  color: #F1F5F9;
}

.menu-icon {
  font-size: 1.3rem;
  cursor: pointer;
  color: #8B7EAB;
}

/* Steps */
.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #251848;
  border: 2px solid #251848;
  color: #8B7EAB;
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step.active .step-circle {
  background: linear-gradient(135deg, #00C9B1, #7B2FBE);
  border-color: transparent;
  color: #fff;
}

.step.completed .step-circle {
  background-color: #00C9B1;
  border-color: #00C9B1;
  color: #fff;
}

.step-label {
  font-size: 0.7rem;
  color: #8B7EAB;
}

.step.active .step-label { color: #00C9B1; }

.step-line {
  width: 60px;
  height: 2px;
  background-color: #251848;
  margin-bottom: 18px;
}

.step-line.active {
  background-color: #00C9B1;
}

/* Formulário */
.form-title {
  font-size: 1.4rem;
  font-weight: 700;
  color: #251848;
}

.form-subtitle {
  color: #8B7EAB;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed #8B7EAB;
  border-radius: 12px;
  padding: 3rem 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  background-color: #F8F9FA;
}

.drop-zone:hover {
  border-color: #00C9B1;
  background-color: rgba(0, 201, 177, 0.05);
}

.drop-zone-content {
  cursor: pointer;
  color: #8B7EAB;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.drop-zone-content h5 {
  color: #251848;
  font-weight: 600;
  font-size: 1.1rem;
}

.drop-zone-content svg {
  color: #00C9B1;
}

/* File Info */
.file-info {
  background-color: #F8F9FA;
  padding: 1rem;
  border-radius: 8px;
}

.file-icon {
  width: 48px;
  height: 48px;
  background-color: #EF4444;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.file-name {
  font-weight: 600;
  color: #251848;
  font-size: 0.95rem;
  word-break: break-word;
}

.file-size {
  font-size: 0.85rem;
  color: #8B7EAB;
}

.btn-remove-file {
  background: none;
  border: none;
  color: #EF4444;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-remove-file:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* PDF Preview */
.pdf-preview {
  margin-top: 1rem;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Botão */
.btn-gradient {
  background: linear-gradient(135deg, #00C9B1, #7B2FBE);
  border: none;
  color: white;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s;
}

.btn-gradient:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 177, 0.3);
}

.btn-gradient:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

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
</style>
