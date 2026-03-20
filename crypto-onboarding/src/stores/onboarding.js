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
    console.log('💾 Dados salvos no cache:', {
      company: company.value,
      partners: partners.value
    })
  }

  function loadFromStorage() {
    try {
      const savedCompany = localStorage.getItem('onboarding_company')
      const savedPartners = localStorage.getItem('onboarding_partners')

      if (savedCompany) {
        company.value = JSON.parse(savedCompany)
        console.log('✅ Dados da empresa carregados do cache')
      }
      if (savedPartners) {
        partners.value = JSON.parse(savedPartners)
        console.log('✅ Dados dos sócios carregados do cache')
      }
    } catch (error) {
      // Log do erro mas NÃO limpa automaticamente
      console.error('❌ Erro ao carregar cache:', error)
      console.warn('⚠️ Cache pode estar corrompido. Use clearStorage() manualmente se necessário.')
    }
  }

  function clearStorage() {
    localStorage.removeItem('onboarding_company')
    localStorage.removeItem('onboarding_partners')
    localStorage.removeItem('cnpj_socios') // Limpa também os sócios do CNPJ
    company.value = { cnpj: '', companyName: '', fantasyName: '', cryptos: '', phone: '', email: '', password: '', passwordConfirm: '' }
    partners.value = []
    console.log('🗑️ Cache limpo')
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