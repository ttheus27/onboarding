<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOnboardingStore } from '../stores/onboarding.js'
import { storeToRefs } from 'pinia'

const router = useRouter()
const store = useOnboardingStore()
const { company } = storeToRefs(store)

const acceptedTerms = ref(false)
const cryptoOptions = ['BTC', 'ETH', 'USDC', 'USDT']

const passwordStrength = ref({ percent: 0, label: '', class: '', color: '' })

onMounted(() => {
  store.loadFromStorage()
})

// Formata CNPJ enquanto digita: 00.000.000/0000-00
function formatCNPJ() {
  let v = company.value.cnpj.replace(/\D/g, '')
  v = v.replace(/^(\d{2})(\d)/, '$1.$2')
  v = v.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
  v = v.replace(/\.(\d{3})(\d)/, '.$1/$2')
  v = v.replace(/(\d{4})(\d)/, '$1-$2')
  company.value.cnpj = v
}

// Formata telefone enquanto digita: (11) 99999-9999
function formatPhone() {
  let v = company.value.phone.replace(/\D/g, '')
  v = v.replace(/^(\d{2})(\d)/, '($1) $2')
  v = v.replace(/(\d{5})(\d{4})$/, '$1-$2')
  company.value.phone = v
}

// Calcula força da senha
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

function handleSubmit() {
  store.saveToStorage()

  // Redireciona para conta existente se e-mail especial
  if (company.value.email === 'exists@transferpay.exchange') {
    router.push('/existing-account')
    return
  }

  router.push('/partners')
}
</script>
<template>
  <div class="register-page">

    <!-- Header -->
    <header class="register-header d-flex align-items-center justify-content-between px-4 py-3">
      <div class="logo d-flex align-items-center gap-2">
        <div class="logo-icon">₿</div>
        <span class="logo-text">NomeDaCorretora</span>
      </div>
      <div class="menu-icon">☰</div>
    </header>

    <!-- Steps -->
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
          <span class="step-label">Verificação</span>
        </div>

      </div>
    </div>

    <!-- Formulário -->
    <div class="form-container px-4 pb-5">
      <h2 class="form-title mt-3 mb-1">Dados da Empresa</h2>
      <p class="form-subtitle mb-4">Preencha os dados iniciais para configurar sua conta empresarial.</p>

      <form @submit.prevent="handleSubmit">

        <!-- CNPJ -->
        <div class="mb-3">
          <label class="form-label">CNPJ</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">🏢</span>
            <input
              v-model="company.cnpj"
              type="text"
              class="form-control ps-5"
              placeholder="00.000.000/0000-00"
              maxlength="18"
              @input="formatCNPJ"
            />
          </div>
        </div>

        <!-- Razão Social -->
        <div class="mb-3">
          <label class="form-label">Razão Social</label>
          <input
            v-model="company.companyName"
            type="text"
            class="form-control"
            placeholder="Empresa LTDA"
          />
        </div>

        <!-- Nome Fantasia -->
        <div class="mb-3">
          <label class="form-label">Nome Fantasia</label>
          <input
            v-model="company.fantasyName"
            type="text"
            class="form-control"
            placeholder="Nome Comercial"
          />
        </div>

      <div class="mb-3">
        <label class="form-label">Moeda Operacional Principal</label>
        <select v-model="company.cryptos" class="form-select">
          <option value="" disabled>Selecione a criptomoeda</option>
          <option value="BTC">BTC — Bitcoin</option>
          <option value="ETH">ETH — Ethereum</option>
          <option value="USDC">USDC — USD Coin</option>
          <option value="USDT">USDT — Tether</option>
        </select>
      </div>
        <!-- Telefone -->
        <div class="mb-3">
          <label class="form-label">Telefone com DDD</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">📞</span>
            <input
              v-model="company.phone"
              type="text"
              class="form-control ps-5"
              placeholder="(11) 99999-9999"
              maxlength="15"
              @input="formatPhone"
            />
          </div>
        </div>

        <!-- Email -->
        <div class="mb-3">
          <label class="form-label">E-mail Corporativo</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">✉️</span>
            <input
              v-model="company.email"
              type="email"
              class="form-control ps-5"
              placeholder="contato@empresa.com.br"
            />
          </div>
        </div>

        <!-- Senha -->
        <div class="mb-3">
          <label class="form-label">Senha</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">🔒</span>
            <input
              v-model="company.password"
              type="password"
              class="form-control ps-5"
              placeholder="••••••••"
              @input="checkPasswordStrength"
            />
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
        </div>

        <!-- Confirmar Senha -->
        <div class="mb-4">
          <label class="form-label">Confirmar Senha</label>
          <div class="input-icon-wrapper">
            <span class="input-icon">🔒</span>
            <input
              v-model="company.passwordConfirm"
              type="password"
              class="form-control ps-5"
              placeholder="••••••••"
            />
          </div>
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

        <!-- Botão -->
        <button type="submit" class="btn btn-gradient w-100 py-3">
          Próximo Passo →
        </button>

      </form>
    </div>
  </div>
</template>

<style scoped>
.register-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  color: #1A1A2E;
  max-width: 480px;
  margin: 0 auto;
}

.register-header {
  background-color: #1A1035;
  border-bottom: 1px solid #E2E8F0;
}

.steps-container { background-color: #00C9B1; }

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
</style>