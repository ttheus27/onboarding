<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding.js'
import { storeToRefs } from 'pinia'
import { registerSchema } from '../services/validators.js'
import { buscarCNPJBrasilAPI } from '../services/cnpj.js'
import { getEstadoByDDD } from '../services/ddd.js'
import { obterCustoSetup, formatarReal } from '../services/quotes.js'
import Logo from '../assets/Logo.png'

const router = useRouter()
const store = useOnboardingStore()
const { company } = storeToRefs(store)

const acceptedTerms = ref(false)
const passwordStrength = ref({ percent: 0, label: '', class: '', color: '' })
const loadingCnpj = ref(false)
const showPassword = ref(false)
const showPasswordConfirm = ref(false)

// Objeto que guarda os erros de cada campo
const errors = ref({})

// Estado identificado pelo DDD
const estadoInfo = computed(() => {
  return getEstadoByDDD(company.value.phone)
})

// Cotações e custo de setup
const custoSetup = ref(null)
const loadingCusto = ref(false)
const intervalId = ref(null)

onMounted(() => {
  console.log('🔄 RegisterView montado, carregando cache...')
  store.loadFromStorage()
  
  console.log('📊 Estado atual após carregar:', company.value)
  
  // Se já houver moeda selecionada, busca o custo
  if (company.value.cryptos) {
    atualizarCustoSetup(company.value.cryptos)
  }
  
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

// Observa mudanças na moeda selecionada
watch(() => company.value.cryptos, async (novaMoeda) => {
  if (novaMoeda) {
    await atualizarCustoSetup(novaMoeda)
  } else {
    custoSetup.value = null
  }
})

// Salva automaticamente no cache sempre que os dados mudarem
watch(company, (novosDados) => {
  console.log('💾 Auto-salvando dados no cache...')
  store.saveToStorage()
}, { deep: true })

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

function formatCNPJ() {
  let v = company.value.cnpj.replace(/\D/g, '')
  
  // Limita a 14 dígitos
  v = v.substring(0, 14)
  
  // Aplica a máscara: 00.000.000/0000-00
  if (v.length <= 2) {
    company.value.cnpj = v
  } else if (v.length <= 5) {
    company.value.cnpj = v.replace(/^(\d{2})(\d{0,3})/, '$1.$2')
  } else if (v.length <= 8) {
    company.value.cnpj = v.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
  } else if (v.length <= 12) {
    company.value.cnpj = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
  } else {
    company.value.cnpj = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5')
  }
}

async function handleCnpjBlur() {
  const cnpjLimpo = company.value.cnpj.replace(/\D/g, '')
  
  // Só busca se tiver 14 dígitos
  if (cnpjLimpo.length !== 14) return
  
  // Limpa erro anterior do CNPJ
  errors.value.cnpj = ''
  
  loadingCnpj.value = true
  
  try {
    const data = await buscarCNPJBrasilAPI(company.value.cnpj)
    
    // Autocomplete dos campos
    company.value.companyName = data.razaoSocial
    company.value.fantasyName = data.nomeFantasia
    
    // Preenche telefone se disponível
    if (data.telefone) {
      company.value.phone = data.telefone
    }
    
    // Salva sócios para a próxima tela
    if (data.socios && data.socios.length > 0) {
      localStorage.setItem('cnpj_socios', JSON.stringify(data.socios))
    }
    
  } catch (error) {
    if (error.message.includes('não está ativa')) {
      errors.value.cnpj = error.message
      // Limpa os campos se empresa não estiver ativa
      company.value.companyName = ''
      company.value.fantasyName = ''
    } else {
      errors.value.cnpj = 'Erro ao buscar CNPJ. Verifique o número.'
    }
  } finally {
    loadingCnpj.value = false
  }
}

function formatPhone() {
  let v = company.value.phone.replace(/\D/g, '')
  v = v.replace(/^(\d{2})(\d)/, '($1) $2')
  v = v.replace(/(\d{5})(\d{4})$/, '$1-$2')
  company.value.phone = v
}

function checkPasswordStrength() {
  const p = company.value.password
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++

  const levels = [
    { percent: 25, label: 'Fraca',  class: 'bg-danger',  color: 'danger' },
    { percent: 50, label: 'Média',  class: 'bg-warning', color: 'warning' },
    { percent: 75, label: 'Boa',    class: 'bg-info',    color: 'info' },
    { percent: 100, label: 'Forte', class: 'bg-success', color: 'success' },
  ]
  passwordStrength.value = levels[Math.max(0, score - 1)]
}

async function handleSubmit() {
  errors.value = {}

  // Valida todos os campos com Yup
  try {
    await registerSchema.validate(company.value, { abortEarly: false })
  } catch (err) {
    // abortEarly: false = mostra TODOS os erros de uma vez
    err.inner.forEach((e) => {
      errors.value[e.path] = e.message
    })
    return // Para aqui se tiver erro
  }

  if (!acceptedTerms.value) {
    errors.value.terms = 'Aceite os termos para continuar'
    return
  }

  console.log('📝 Salvando dados antes de navegar...')
  store.saveToStorage()

  if (company.value.email === 'exists@transferpay.exchange') {
    router.push('/existing-account')
    return
  }

  router.push('/partners')
}
</script>
<template>
  <!-- Header (fora do container) -->
  <header class="register-header d-flex align-items-center justify-content-between px-4 py-3">
    <div class="logo d-flex align-items-center gap-2">
      <img :src="Logo" alt="Logo" class="logo-image" />
      <span class="logo-text">TransferCripto</span>
    </div>
    <div class="menu-icon">☰</div>
  </header>

  <!-- Steps (fora do container) -->
  <div class="steps-container px-4 pt-3 pb-2">
    <div class="d-flex align-items-center justify-content-center gap-0">

      <div class="step active">
        <div class="step-circle">1</div>
        <span class="step-label">Empresa</span>
      </div>

      <div class="step-line"></div>

      <div class="step">
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

  <!-- Formulário (dentro do container centralizado) -->
  <div class="register-page">
    <div class="form-container px-4 pb-5">
      <h2 class="form-title mt-3 mb-1">Dados da Empresa</h2>
      <p class="form-subtitle mb-4">Preencha os dados iniciais para configurar sua conta empresarial.</p>

      <form @submit.prevent="handleSubmit">

        <!-- CNPJ -->
        <div class="mb-3">
          <label class="form-label">CNPJ</label>
          <div class="input-icon-wrapper position-relative">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M4 2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3 0a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1ZM4 5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM7.5 5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1ZM4.5 8a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Zm2.5.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5v-1Zm3.5-.5a.5.5 0 0 0-.5.5v1a.5.5 0 0 0 .5.5h1a.5.5 0 0 0 .5-.5v-1a.5.5 0 0 0-.5-.5h-1Z"/>
                <path d="M2 1a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V1Zm11 0H3v14h3v-2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5V15h3V1Z"/>
              </svg>
            </span>
            <input
              v-model="company.cnpj"
              type="text"
              class="form-control ps-5"
              :class="{ 'is-invalid': errors.cnpj }"
              placeholder="00.000.000/0000-00"
              maxlength="18"
              @input="formatCNPJ"
              @blur="handleCnpjBlur"
            />
            <!-- Indicador de loading -->
            <span v-if="loadingCnpj" class="spinner-border spinner-border-sm position-absolute end-0 me-3" style="top: 50%; transform: translateY(-50%)"></span>
          </div>
          <small class="text-danger" v-if="errors.cnpj">{{ errors.cnpj }}</small>
        </div>

        <!-- Razão Social -->
        <div class="mb-3">
          <label class="form-label">Razão Social</label>
          <input
            v-model="company.companyName"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors.companyName }"
            placeholder="Empresa LTDA"
          />
            <small class="text-danger" v-if="errors.companyName">{{ errors.companyName }}</small>
        </div>

        <!-- Nome Fantasia -->
        <div class="mb-3">
          <label class="form-label">Nome Fantasia</label>
          <input
            v-model="company.fantasyName"
            type="text"
            class="form-control"
            :class="{ 'is-invalid': errors.fantasyName }"
            placeholder="Nome Comercial"
          />
          <small class="text-danger d-block mt-1" v-if="errors.fantasyName">{{ errors.fantasyName }}</small>

        </div>

      <div class="mb-3">
        <label class="form-label">Moeda Operacional Principal</label>
        <select v-model="company.cryptos" class="form-select" :class="{ 'is-invalid': errors.cryptos }">
          <option value="" disabled>Selecione a criptomoeda</option>
          <option value="BTC">BTC — Bitcoin</option>
          <option value="ETH">ETH — Ethereum</option>
          <option value="USDC">USDC — USD Coin</option>
          <option value="USDT">USDT — Tether</option>
        </select>
        <small class="text-danger d-block mt-1" v-if="errors.cryptos">{{ errors.cryptos }}</small>
      </div>

      <!-- Card de Custo de Setup -->
      <div v-if="custoSetup" class="custo-setup-card mt-3 mb-3">
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
        
        <small class="text-muted d-block text-center">
          Atualizado em: {{ new Date(custoSetup.timestamp).toLocaleTimeString('pt-BR') }}
        </small>
      </div>
        <!-- Telefone -->
        <div class="mb-3">
          <label class="form-label">Telefone com DDD</label>
          <div class="input-icon-wrapper position-relative">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z"/>
              </svg>
            </span>
            <input
              v-model="company.phone"
              type="text"
              class="form-control ps-5"
              :class="{ 'is-invalid': errors.phone, 'pe-5': estadoInfo }"
              placeholder="(11) 99999-9999"
              maxlength="15"
              @input="formatPhone"
            />
            <!-- Bandeira do estado -->
            <div v-if="estadoInfo" class="estado-flag" :title="estadoInfo.nome">
              <img 
                :src="`/src/assets/flags/${estadoInfo.bandeira}`" 
                :alt="estadoInfo.nome"
                class="flag-image"
              />
              <span class="estado-sigla">{{ estadoInfo.estado }}</span>
            </div>
          </div>
        <small class="text-danger d-block mt-1" v-if="errors.phone">{{ errors.phone }}</small>

        </div>

        <!-- Email -->
        <div class="mb-3">
          <label class="form-label">E-mail Corporativo</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z"/>
              </svg>
            </span>
            <input
              v-model="company.email"
              type="email"
              class="form-control ps-5"
              :class="{ 'is-invalid': errors.email }"
              placeholder="contato@empresa.com.br"
            />
          </div>
        <small class="text-danger d-block mt-1" v-if="errors.email">{{ errors.email }}</small>

        </div>

        <!-- Senha -->
        <div class="mb-3">
          <label class="form-label">Senha</label>
          <div class="input-icon-wrapper position-relative">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            <input
              v-model="company.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control ps-5 pe-5"
              :class="{ 'is-invalid': errors.password }"
              placeholder="••••••••"
              @input="checkPasswordStrength"
            />
            <button
              type="button"
              class="btn-toggle-password"
              @click="showPassword = !showPassword"
              tabindex="-1"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
              </svg>
            </button>
          </div>
          <!-- Barra de força da senha -->
          <div class="password-strength mt-2" v-if="company.password">
            <div class="strength-bar">
              <div
                class="strength-fill"
                :style="{ width: passwordStrength.percent + '%' }"
                :class="passwordStrength.class"
              ></div>
            </div>
            <small :class="'text-' + passwordStrength.color">
              {{ passwordStrength.label }}
            </small>
          </div>
        <small class="text-danger d-block mt-1" v-if="errors.password">{{ errors.password }}</small>

        </div>

        <!-- Confirmar Senha -->
        <div class="mb-4">
          <label class="form-label">Confirmar Senha</label>
          <div class="input-icon-wrapper position-relative">
            <span class="input-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              </svg>
            </span>
            <input
              v-model="company.passwordConfirm"
              :type="showPasswordConfirm ? 'text' : 'password'"
              class="form-control ps-5 pe-5"
              :class="{ 'is-invalid': errors.passwordConfirm }"
              placeholder="••••••••"
            />
            <button
              type="button"
              class="btn-toggle-password"
              @click="showPasswordConfirm = !showPasswordConfirm"
              tabindex="-1"
            >
              <svg v-if="!showPasswordConfirm" xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/>
                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a7.028 7.028 0 0 0-2.79.588l.77.771A5.944 5.944 0 0 1 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.134 13.134 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755-.165.165-.337.328-.517.486l.708.709z"/>
                <path d="M11.297 9.176a3.5 3.5 0 0 0-4.474-4.474l.823.823a2.5 2.5 0 0 1 2.829 2.829l.822.822zm-2.943 1.299.822.822a3.5 3.5 0 0 1-4.474-4.474l.823.823a2.5 2.5 0 0 0 2.829 2.829z"/>
                <path d="M3.35 5.47c-.18.16-.353.322-.518.487A13.134 13.134 0 0 0 1.172 8l.195.288c.335.48.83 1.12 1.465 1.755C4.121 11.332 5.881 12.5 8 12.5c.716 0 1.39-.133 2.02-.36l.77.772A7.029 7.029 0 0 1 8 13.5C3 13.5 0 8 0 8s.939-1.721 2.641-3.238l.708.709zm10.296 8.884-12-12 .708-.708 12 12-.708.708z"/>
              </svg>
            </button>
          </div>
        <small class="text-danger d-block mt-1" v-if="errors.passwordConfirm">{{ errors.passwordConfirm }}</small>

        </div>

        <!-- Termos -->
        <div class="mb-4 d-flex align-items-start gap-2">
          <input type="checkbox" v-model="acceptedTerms" class="mt-1" id="terms" />
          <label for="terms" class="small text-muted">
            Eu concordo com os
            <a href="#" class="text-accent">Termos de Serviço</a>
            e
            <a href="#" class="text-accent">Política de Privacidade</a>
          </label>
        </div>
        <small class="text-danger d-block mt-1" v-if="errors.terms">{{ errors.terms }}</small>

        <!-- Botão -->
        <button type="submit" class="btn btn-gradient w-100 py-3">
          Próximo Passo →
        </button>

      </form>
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
.register-page {
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
  
  .form-title {
    font-size: 1.75rem;
  }
  
  .step-circle {
    width: 40px;
    height: 40px;
    font-size: 1rem;
  }
  
  .step-line {
    width: 100px;
  }
}

/* Responsivo para Desktop */
@media (min-width: 1024px) {
  .form-container {
    max-width: 960px;
    padding: 2.5rem 4rem !important;
  }
  
  .form-title {
    font-size: 2rem;
  }
  
  .step-line {
    width: 140px;
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

.register-header {
  background-color: #1A1035;
  border-bottom: 1px solid #E2E8F0;
}

.steps-container { background-color: #00C9B1; }

.logo-image {
  height: 40px;
  width: auto;
  object-fit: contain;
}

.logo-icon {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #00C9B1, #7B2FBE);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
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
.steps-container { background-color: #E2E8F0; }

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

/* Input com ícone */
.input-icon-wrapper { position: relative; }

.input-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 0.95rem;
  z-index: 2;
  color: #8B7EAB;
  display: flex;
  align-items: center;
}

/* Botão de toggle de senha */
.btn-toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #8B7EAB;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  transition: color 0.2s;
}

.btn-toggle-password:hover {
  color: #00C9B1;
}

.btn-toggle-password:focus {
  outline: none;
}

/* Estado/Bandeira no telefone */
.estado-flag {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: rgba(0, 201, 177, 0.1);
  padding: 4px 8px;
  border-radius: 6px;
  z-index: 3;
}

.flag-image {
  width: 24px;
  height: 16px;
  object-fit: cover;
  border-radius: 2px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.estado-sigla {
  font-size: 0.75rem;
  font-weight: 600;
  color: #00C9B1;
}

/* Chips de cripto */
.crypto-chip {
  padding: 6px 16px;
  border-radius: 20px;
  border: 1.5px solid #251848;
  background-color: #251848;
  color: #8B7EAB;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 600;
  transition: all 0.2s;
}

.crypto-chip.selected {
  border-color: #00C9B1;
  background-color: rgba(0, 201, 177, 0.1);
  color: #00C9B1;
}

/* Força da senha */
.strength-bar {
  height: 4px;
  background-color: #251848;
  border-radius: 4px;
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.text-accent { color: #00C9B1; }

/* Campos com erro */
.form-control.is-invalid,
.form-select.is-invalid {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25);
}

.form-control.is-invalid:focus,
.form-select.is-invalid:focus {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 0.25rem rgba(239, 68, 68, 0.25);
}

/* Card de Custo de Setup */
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

.detalhe-item span:last-child {
  font-weight: 600;
  color: #1A1A2E;
}
</style>