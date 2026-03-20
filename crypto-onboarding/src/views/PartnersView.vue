<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding.js'
import { storeToRefs } from 'pinia'
import { partnerSchema, partnersListSchema } from '../services/validators.js'
import { buscarCEP } from '../services/cep.js'
import Logo from '../assets/Logo.png'

const router = useRouter()
const store = useOnboardingStore()
const { partners } = storeToRefs(store)

// Formulário do sócio atual
const currentPartner = ref({
  fullName: '',
  cpf: '',
  cep: '',
  street: '',
  number: '',
  complement: '',
  neighborhood: '',
  city: '',
  state: '',
  nationality: 'Brasileira',
  participation: 0,
  isPep: false,
  documents: [],
})

const errors = ref({})
const editingIndex = ref(-1)
const loadingCep = ref(false)

onMounted(() => {
  store.loadFromStorage()
  
  // Carrega sócios do CNPJ se disponível e se ainda não há sócios cadastrados
  const sociosCnpj = localStorage.getItem('cnpj_socios')
  if (sociosCnpj && partners.value.length === 0) {
    try {
      const socios = JSON.parse(sociosCnpj)
      
      // Pré-preenche a lista com os nomes dos sócios
      // Usuário ainda precisa completar CPF, endereço, participação, etc.
      socios.forEach(socio => {
        partners.value.push({
          fullName: socio.nome || '',
          cpf: '',
          cep: '',
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          nationality: 'Brasileira',
          participation: 0, // Usuário define manualmente
          isPep: false,
          documents: [],
        })
      })
      
      // Salva no store
      store.saveToStorage()
      
      // Limpa o cache de sócios do CNPJ
      localStorage.removeItem('cnpj_socios')
    } catch (error) {
      console.error('Erro ao carregar sócios do CNPJ:', error)
    }
  }
})

// Salva automaticamente no cache sempre que a lista de sócios mudar
watch(partners, () => {
  console.log('💾 Auto-salvando sócios no cache...')
  store.saveToStorage()
}, { deep: true })

// Calcula participação restante
const remainingParticipation = computed(() => {
  const total = partners.value.reduce((sum, p) => sum + p.participation, 0)
  return Math.max(0, 100 - total)
})

// Formata CPF
function formatCPF() {
  let v = currentPartner.value.cpf.replace(/\D/g, '')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d)/, '$1.$2')
  v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  currentPartner.value.cpf = v
}

// Formata CEP
function formatCEP() {
  let v = currentPartner.value.cep.replace(/\D/g, '')
  v = v.replace(/(\d{5})(\d)/, '$1-$2')
  currentPartner.value.cep = v
}

// Busca endereço pelo CEP
async function handleCepBlur() {
  if (currentPartner.value.cep.replace(/\D/g, '').length === 8) {
    loadingCep.value = true
    try {
      const address = await buscarCEP(currentPartner.value.cep)
      currentPartner.value.street = address.street
      currentPartner.value.neighborhood = address.neighborhood
      currentPartner.value.city = address.city
      currentPartner.value.state = address.state
      if (address.complement) {
        currentPartner.value.complement = address.complement
      }
    } catch (error) {
      errors.value.cep = 'CEP não encontrado'
    } finally {
      loadingCep.value = false
    }
  }
}

// Manipula upload de documentos
function handleFileChange(event) {
  const files = Array.from(event.target.files)
  currentPartner.value.documents = [
    ...currentPartner.value.documents,
    ...files.map(f => ({ name: f.name, size: f.size }))
  ]
}

// Manipula drag and drop
function handleDrop(event) {
  event.preventDefault()
  const files = Array.from(event.dataTransfer.files)
  currentPartner.value.documents = [
    ...currentPartner.value.documents,
    ...files.map(f => ({ name: f.name, size: f.size }))
  ]
}

function handleDragOver(event) {
  event.preventDefault()
}

// Remove documento
function removeDocument(index) {
  currentPartner.value.documents.splice(index, 1)
}

// Adiciona ou atualiza sócio
async function addOrUpdatePartner() {
  errors.value = {}

  try {
    await partnerSchema.validate(currentPartner.value, { abortEarly: false })
  } catch (err) {
    err.inner.forEach((e) => {
      errors.value[e.path] = e.message
    })
    return
  }

  if (editingIndex.value >= 0) {
    partners.value[editingIndex.value] = { ...currentPartner.value }
    editingIndex.value = -1
  } else {
    partners.value.push({ ...currentPartner.value })
  }

  resetForm()
  store.saveToStorage()
}

// Edita sócio
function editPartner(index) {
  currentPartner.value = { ...partners.value[index] }
  editingIndex.value = index
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Remove sócio
function removePartner(index) {
  if (confirm('Deseja remover este sócio?')) {
    partners.value.splice(index, 1)
    store.saveToStorage()
  }
}

// Reseta formulário
function resetForm() {
  currentPartner.value = {
    fullName: '',
    cpf: '',
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    nationality: 'Brasileira',
    participation: 0,
    isPep: false,
    documents: [],
  }
  errors.value = {}
  editingIndex.value = -1
}

// Finaliza cadastro de sócios
async function handleSubmit() {
  errors.value = {}

  try {
    await partnersListSchema.validate({ partners: partners.value }, { abortEarly: false })
  } catch (err) {
    err.inner.forEach((e) => {
      errors.value.general = e.message
    })
    return
  }

  store.saveToStorage()
  router.push('/contract')
}

function goBack() {
  router.push('/')
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

      <div class="step active">
        <div class="step-circle">2</div>
        <span class="step-label">Sócios</span>
      </div>

      <div class="step-line"></div>

      <div class="step">
        <div class="step-circle">3</div>
        <span class="step-label">Contrato</span>
      </div>
    </div>
  </div>

  <!-- Conteúdo (dentro do container centralizado) -->
  <div class="partners-page">
    <div class="form-container px-4 pb-5">
      <h2 class="form-title mt-3 mb-1">Cadastro de Sócios</h2>
      <p class="form-subtitle mb-3">
        Adicione todos os sócios da empresa. A participação total deve somar 100%.
      </p>

      <!-- Alerta de participação -->
      <div class="alert alert-info mb-4" v-if="partners.length > 0">
        <strong>Participação restante:</strong> {{ remainingParticipation.toFixed(2) }}%
      </div>

      <!-- Formulário -->
      <form @submit.prevent="addOrUpdatePartner" class="partner-form">
        <h5 class="mb-3">{{ editingIndex >= 0 ? 'Editar Sócio' : 'Adicionar Sócio' }}</h5>

        <!-- Nome Completo -->
        <div class="mb-3">
          <label class="form-label">Nome Completo</label>
          <input
            v-model="currentPartner.fullName"
            type="text"
            class="form-control"
            placeholder="Nome completo do sócio"
          />
          <small class="text-danger" v-if="errors.fullName">{{ errors.fullName }}</small>
        </div>

        <!-- CPF -->
        <div class="mb-3">
          <label class="form-label">CPF</label>
          <input
            v-model="currentPartner.cpf"
            type="text"
            class="form-control"
            placeholder="000.000.000-00"
            maxlength="14"
            @input="formatCPF"
          />
          <small class="text-danger" v-if="errors.cpf">{{ errors.cpf }}</small>
        </div>

        <!-- CEP -->
        <div class="mb-3">
          <label class="form-label">CEP</label>
          <input
            v-model="currentPartner.cep"
            type="text"
            class="form-control"
            placeholder="00000-000"
            maxlength="9"
            @input="formatCEP"
            @blur="handleCepBlur"
          />
          <small class="text-muted" v-if="loadingCep">Buscando endereço...</small>
          <small class="text-danger" v-if="errors.cep">{{ errors.cep }}</small>
        </div>

        <!-- Logradouro -->
        <div class="mb-3">
          <label class="form-label">Logradouro</label>
          <input
            v-model="currentPartner.street"
            type="text"
            class="form-control"
            placeholder="Rua, Avenida, etc."
          />
          <small class="text-danger" v-if="errors.street">{{ errors.street }}</small>
        </div>

        <!-- Número e Complemento -->
        <div class="row mb-3">
          <div class="col-4">
            <label class="form-label">Número</label>
            <input
              v-model="currentPartner.number"
              type="text"
              class="form-control"
              placeholder="123"
            />
            <small class="text-danger" v-if="errors.number">{{ errors.number }}</small>
          </div>
          <div class="col-8">
            <label class="form-label">Complemento</label>
            <input
              v-model="currentPartner.complement"
              type="text"
              class="form-control"
              placeholder="Apto, Sala, etc."
            />
          </div>
        </div>

        <!-- Bairro -->
        <div class="mb-3">
          <label class="form-label">Bairro</label>
          <input
            v-model="currentPartner.neighborhood"
            type="text"
            class="form-control"
            placeholder="Bairro"
          />
          <small class="text-danger" v-if="errors.neighborhood">{{ errors.neighborhood }}</small>
        </div>

        <!-- Cidade e Estado -->
        <div class="row mb-3">
          <div class="col-8">
            <label class="form-label">Cidade</label>
            <input
              v-model="currentPartner.city"
              type="text"
              class="form-control"
              placeholder="Cidade"
            />
            <small class="text-danger" v-if="errors.city">{{ errors.city }}</small>
          </div>
          <div class="col-4">
            <label class="form-label">UF</label>
            <input
              v-model="currentPartner.state"
              type="text"
              class="form-control"
              placeholder="SP"
              maxlength="2"
            />
            <small class="text-danger" v-if="errors.state">{{ errors.state }}</small>
          </div>
        </div>

        <!-- Nacionalidade -->
        <div class="mb-3">
          <label class="form-label">Nacionalidade</label>
          <input
            v-model="currentPartner.nationality"
            type="text"
            class="form-control"
            placeholder="Brasileira"
          />
          <small class="text-danger" v-if="errors.nationality">{{ errors.nationality }}</small>
        </div>

        <!-- Participação -->
        <div class="mb-3">
          <label class="form-label">Participação (%)</label>
          <input
            v-model.number="currentPartner.participation"
            type="number"
            step="0.01"
            class="form-control"
            placeholder="0.00"
            min="0"
            max="100"
          />
          <small class="text-danger" v-if="errors.participation">{{ errors.participation }}</small>
        </div>

        <!-- PEP -->
        <div class="mb-3">
          <div class="form-check">
            <input
              v-model="currentPartner.isPep"
              type="checkbox"
              class="form-check-input"
              id="isPep"
            />
            <label class="form-check-label" for="isPep">
              É Pessoa Exposta Politicamente (PEP)?
            </label>
          </div>
        </div>

        <!-- Upload de Documentos -->
        <div class="mb-3">
          <label class="form-label">Documentos (RG, CNH, etc.)</label>
          <div
            class="drop-zone"
            @drop="handleDrop"
            @dragover="handleDragOver"
          >
            <input
              type="file"
              multiple
              accept="image/*,.pdf"
              @change="handleFileChange"
              id="fileInput"
              style="display: none"
            />
            <label for="fileInput" class="drop-zone-label">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16" style="margin-bottom: 8px;">
                <path d="M5.5 7a.5.5 0 0 0 0 1h5a.5.5 0 0 0 0-1h-5zM5 9.5a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5z"/>
                <path d="M9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.5L9.5 0zm0 1v2A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5z"/>
              </svg>
              <div>Clique ou arraste arquivos aqui</div>
            </label>
          </div>
          <small class="text-danger" v-if="errors.documents">{{ errors.documents }}</small>

          <!-- Lista de documentos -->
          <div v-if="currentPartner.documents.length > 0" class="mt-2">
            <div
              v-for="(doc, index) in currentPartner.documents"
              :key="index"
              class="document-item"
            >
              <span>{{ doc.name }}</span>
              <button type="button" @click="removeDocument(index)" class="btn-remove">×</button>
            </div>
          </div>
        </div>

        <!-- Botões -->
        <div class="d-flex gap-2">
          <button type="submit" class="btn btn-gradient flex-grow-1">
            {{ editingIndex >= 0 ? 'Atualizar Sócio' : 'Adicionar Sócio' }}
          </button>
          <button
            v-if="editingIndex >= 0"
            type="button"
            @click="resetForm"
            class="btn btn-secondary"
          >
            Cancelar
          </button>
        </div>
      </form>

      <!-- Lista de Sócios Adicionados -->
      <div v-if="partners.length > 0" class="partners-list mt-5">
        <h5 class="mb-3">Sócios Cadastrados ({{ partners.length }})</h5>
        
        <div
          v-for="(partner, index) in partners"
          :key="index"
          class="partner-card"
        >
          <div class="partner-info">
            <strong>{{ partner.fullName }}</strong>
            <small class="text-muted d-block">CPF: {{ partner.cpf }}</small>
            <small class="text-muted d-block">Participação: {{ partner.participation }}%</small>
          </div>
          <div class="partner-actions">
            <button @click="editPartner(index)" class="btn btn-sm btn-outline-primary">
              Editar
            </button>
            <button @click="removePartner(index)" class="btn btn-sm btn-outline-danger">
              Remover
            </button>
          </div>
        </div>
      </div>

      <!-- Erro geral -->
      <div v-if="errors.general" class="alert alert-danger mt-3">
        {{ errors.general }}
      </div>

      <!-- Botão Finalizar -->
      <button
        v-if="partners.length > 0"
        @click="handleSubmit"
        class="btn btn-gradient w-100 py-3 mt-4"
      >
        Próximo Passo →
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
.partners-page {
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

.partner-form {
  background-color: #F8F9FA;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

/* Drop Zone */
.drop-zone {
  border: 2px dashed #8B7EAB;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.drop-zone:hover {
  border-color: #00C9B1;
  background-color: rgba(0, 201, 177, 0.05);
}

.drop-zone-label {
  cursor: pointer;
  color: #8B7EAB;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* Documentos */
.document-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background-color: #fff;
  border-radius: 6px;
  margin-bottom: 0.5rem;
  font-size: 0.85rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #dc3545;
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
}

/* Lista de Sócios */
.partner-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #F8F9FA;
  border-radius: 8px;
  margin-bottom: 0.75rem;
}

.partner-actions {
  display: flex;
  gap: 0.5rem;
}
</style>
