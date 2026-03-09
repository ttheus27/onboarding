<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Logo from '../assets/Logo.png'

const router = useRouter()
const email = ref('exists@transferpay.exchange')
const password = ref('')
const showRecovery = ref(false)
const showPassword = ref(false)
const recoveryEmail = ref('')
const errors = ref({})
const loading = ref(false)
const successMessage = ref('')

function handleLogin() {
  errors.value = {}
  
  if (!password.value) {
    errors.value.password = 'Digite sua senha'
    return
  }
  
  if (password.value.length < 8) {
    errors.value.password = 'Senha deve ter no mínimo 8 caracteres'
    return
  }
  
  loading.value = true
  
  // Simula login (em produção, faria chamada à API)
  setTimeout(() => {
    loading.value = false
    // Aqui você redirecionaria para o dashboard
    alert('Login realizado com sucesso! (simulação)')
  }, 1500)
}

function handleRecovery() {
  errors.value = {}
  
  if (!recoveryEmail.value) {
    errors.value.recoveryEmail = 'Digite seu e-mail'
    return
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(recoveryEmail.value)) {
    errors.value.recoveryEmail = 'E-mail inválido'
    return
  }
  
  loading.value = true
  
  // Simula envio de email de recuperação
  setTimeout(() => {
    loading.value = false
    successMessage.value = 'E-mail de recuperação enviado! Verifique sua caixa de entrada.'
    setTimeout(() => {
      successMessage.value = ''
      showRecovery.value = false
    }, 3000)
  }, 1500)
}

function goBack() {
  router.push('/')
}

function toggleRecovery() {
  showRecovery.value = !showRecovery.value
  errors.value = {}
  successMessage.value = ''
}
</script>

<template>
  <div class="existing-account-page">
    <!-- Header -->
    <header class="existing-header d-flex align-items-center justify-content-between px-4 py-3">
      <button @click="goBack" class="btn-back">← Voltar</button>
      <div class="logo d-flex align-items-center gap-2">
        <img :src="Logo" alt="Logo" class="logo-image" />
        <span class="logo-text">TransferCripto</span>
      </div>
      <div style="width: 60px"></div>
    </header>

    <!-- Conteúdo -->
    <div class="content-container px-4 pb-5">
      <!-- Ícone de alerta -->
      <div class="alert-icon-wrapper text-center mt-5 mb-4">
        <div class="alert-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        </div>
      </div>

      <!-- Mensagem principal -->
      <h2 class="title text-center mb-2">Conta já cadastrada</h2>
      <p class="subtitle text-center mb-5">
        Este e-mail já está registrado em nosso sistema. Faça login para acessar sua conta ou recupere sua senha.
      </p>

      <!-- Formulário de Login -->
      <div v-if="!showRecovery" class="form-card">
        <h5 class="form-card-title mb-4">Entrar na sua conta</h5>

        <form @submit.prevent="handleLogin">
          <!-- Email (readonly) -->
          <div class="mb-3">
            <label class="form-label">E-mail</label>
            <input
              v-model="email"
              type="email"
              class="form-control"
              readonly
              disabled
            />
          </div>

          <!-- Senha -->
          <div class="mb-3">
            <label class="form-label">Senha</label>
            <div class="position-relative">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="form-control pe-5"
                :class="{ 'is-invalid': errors.password }"
                placeholder="Digite sua senha"
                @input="errors.password = ''"
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
            <small class="text-danger" v-if="errors.password">{{ errors.password }}</small>
          </div>

          <!-- Link de recuperação -->
          <div class="mb-4 text-end">
            <a href="#" @click.prevent="toggleRecovery" class="link-recovery">
              Esqueceu sua senha?
            </a>
          </div>

          <!-- Botão de login -->
          <button type="submit" class="btn btn-gradient w-100 py-3" :disabled="loading">
            <span v-if="!loading">Entrar</span>
            <span v-else>
              <span class="spinner-border spinner-border-sm me-2"></span>
              Entrando...
            </span>
          </button>
        </form>

        <!-- Divider -->
        <div class="divider my-4">
          <span>ou</span>
        </div>

        <!-- Botão de novo cadastro -->
        <button @click="goBack" class="btn btn-outline w-100 py-3">
          Usar outro e-mail
        </button>
      </div>

      <!-- Formulário de Recuperação -->
      <div v-else class="form-card">
        <h5 class="form-card-title mb-2">Recuperar senha</h5>
        <p class="form-card-subtitle mb-4">
          Digite seu e-mail e enviaremos um link para redefinir sua senha.
        </p>

        <!-- Mensagem de sucesso -->
        <div v-if="successMessage" class="alert alert-success mb-4">
          {{ successMessage }}
        </div>

        <form @submit.prevent="handleRecovery">
          <!-- Email de recuperação -->
          <div class="mb-4">
            <label class="form-label">E-mail</label>
            <input
              v-model="recoveryEmail"
              type="email"
              class="form-control"
              :class="{ 'is-invalid': errors.recoveryEmail }"
              placeholder="seu@email.com"
              @input="errors.recoveryEmail = ''"
            />
            <small class="text-danger" v-if="errors.recoveryEmail">{{ errors.recoveryEmail }}</small>
          </div>

          <!-- Botão de enviar -->
          <button type="submit" class="btn btn-gradient w-100 py-3 mb-3" :disabled="loading">
            <span v-if="!loading">Enviar link de recuperação</span>
            <span v-else>
              <span class="spinner-border spinner-border-sm me-2"></span>
              Enviando...
            </span>
          </button>

          <!-- Botão de voltar -->
          <button type="button" @click="toggleRecovery" class="btn btn-outline w-100 py-3">
            Voltar para login
          </button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.existing-account-page {
  min-height: 100vh;
  background-color: #FFFFFF;
  color: #1A1A2E;
  max-width: 480px;
  margin: 0 auto;
}

.existing-header {
  background-color: #1A1035;
  border-bottom: 1px solid #E2E8F0;
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

/* Ícone de alerta */
.alert-icon-wrapper {
  margin-top: 2rem;
}

.alert-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
}

/* Títulos */
.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #251848;
}

.subtitle {
  color: #8B7EAB;
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 400px;
  margin: 0 auto;
}

/* Card do formulário */
.form-card {
  background-color: #F8F9FA;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-card-title {
  font-size: 1.2rem;
  font-weight: 700;
  color: #251848;
}

.form-card-subtitle {
  color: #8B7EAB;
  font-size: 0.9rem;
  line-height: 1.4;
}

/* Link de recuperação */
.link-recovery {
  color: #00C9B1;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
}

.link-recovery:hover {
  text-decoration: underline;
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
}

.divider::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  height: 1px;
  background-color: #E2E8F0;
}

.divider span {
  position: relative;
  background-color: #F8F9FA;
  padding: 0 1rem;
  color: #8B7EAB;
  font-size: 0.85rem;
}

/* Botões */
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

.btn-outline {
  background: transparent;
  border: 2px solid #251848;
  color: #251848;
  font-weight: 600;
  border-radius: 12px;
  transition: all 0.3s;
}

.btn-outline:hover {
  background-color: #251848;
  color: white;
}

/* Campos com erro */
.form-control.is-invalid {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 0.2rem rgba(239, 68, 68, 0.25);
}

.form-control.is-invalid:focus {
  border-color: #EF4444 !important;
  box-shadow: 0 0 0 0.25rem rgba(239, 68, 68, 0.25);
}

/* Alert de sucesso */
.alert-success {
  background-color: rgba(16, 185, 129, 0.1);
  border: 1px solid #10B981;
  color: #065F46;
  border-radius: 8px;
  padding: 1rem;
  font-size: 0.9rem;
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
</style>
