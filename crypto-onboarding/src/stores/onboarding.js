import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useOnboardingStore = defineStore('onboarding', () => {

  // ─── Dados da Tela 1 (Registro) ───────────────────────────
  const company = ref({
    cnpj: '',
    companyName: '',
    fantasyName: '',
    cryptos: '',
    phone: '',
    email: '',
    password: '',
    passwordConfirm: '',
  })

  // ─── Dados da Tela 3 (Sócios) ─────────────────────────────
  const partners = ref([])

  // ─── Ações ────────────────────────────────────────────────
  function saveToStorage() {
    localStorage.setItem('onboarding_company', JSON.stringify(company.value))
    localStorage.setItem('onboarding_partners', JSON.stringify(partners.value))
  }

  function loadFromStorage() {
    try {
      const savedCompany = localStorage.getItem('onboarding_company')
      const savedPartners = localStorage.getItem('onboarding_partners')

      if (savedCompany) {
        company.value = JSON.parse(savedCompany)
      }
      if (savedPartners) {
        partners.value = JSON.parse(savedPartners)
      }
    } catch (error) {
      // Se houver erro, limpa o localStorage
      clearStorage()
    }
  }

  function clearStorage() {
    localStorage.removeItem('onboarding_company')
    localStorage.removeItem('onboarding_partners')
    company.value = { cnpj: '', companyName: '', fantasyName: '', cryptos: [], phone: '', email: '', password: '', passwordConfirm: '' }
    partners.value = []
  }

  return {
    company,
    partners,
    saveToStorage,
    loadFromStorage,
    clearStorage,
  }

}, {
  persist: false // vamos controlar manualmente pelo localStorage
})