<template>
  <div class="welcome-page">
    <div class="welcome-container">
      <!-- Logo -->
      <div class="logo-section">
        <img :src="Logo" alt="TransferCripto" class="logo-image" />
        <h1 class="brand-name">TransferCripto</h1>
      </div>

      <!-- Mensagem de Sucesso -->
      <div class="success-icon">
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" fill="currentColor" viewBox="0 0 16 16">
          <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
        </svg>
      </div>

      <h2 class="welcome-title">Bem-vindo!</h2>
      <p class="welcome-message">
        Seu cadastro foi realizado com sucesso.<br>
        Em breve você receberá um e-mail com as próximas instruções.
      </p>

      <!-- Informações -->
      <div class="info-box">
        <p class="info-text">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
            <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
          Nossa equipe analisará seus documentos em até 48 horas úteis.
        </p>
      </div>

      <!-- Botão -->
      <button class="btn btn-gradient w-100 mt-4" @click="goToHome">
        Voltar ao Início
      </button>
    </div>
  </div>
</template>

<script setup>
import Logo from '../assets/Logo.png'
import { useRouter } from 'vue-router'

const router = useRouter()

function goToHome() {
  router.push('/')
}
</script>

<style scoped>
.welcome-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1A1035 0%, #2D1B4E 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.welcome-container {
  max-width: 480px;
  width: 100%;
  text-align: center;
}

.logo-section {
  margin-bottom: 2rem;
}

.logo-image {
  height: 60px;
  width: auto;
  margin-bottom: 1rem;
}

.brand-name {
  font-size: 1.5rem;
  font-weight: 700;
  color: #FFFFFF;
  margin: 0;
}

.success-icon {
  color: #00C9B1;
  margin-bottom: 1.5rem;
  animation: scaleIn 0.5s ease-out;
}

@keyframes scaleIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.welcome-title {
  font-size: 2rem;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 1rem;
}

.welcome-message {
  font-size: 1rem;
  color: #E2E8F0;
  line-height: 1.6;
  margin-bottom: 2rem;
}

.info-box {
  background: rgba(0, 201, 177, 0.1);
  border: 1px solid rgba(0, 201, 177, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.info-text {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #E2E8F0;
  font-size: 0.9rem;
  margin: 0;
  text-align: left;
}

.info-text svg {
  flex-shrink: 0;
  color: #00C9B1;
}

.btn-gradient {
  background: linear-gradient(135deg, #00C9B1, #7B2FBE);
  border: none;
  color: white;
  font-weight: 600;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-size: 1rem;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 201, 177, 0.3);
}

.btn-gradient:active {
  transform: translateY(0);
}
</style>
