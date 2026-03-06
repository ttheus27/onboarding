import axios from 'axios'

/**
 * Busca endereço pelo CEP usando a API ViaCEP
 * @param {string} cep - CEP no formato 00000-000 ou 00000000
 * @returns {Promise<Object>} Dados do endereço
 */
export async function buscarCEP(cep) {
  try {
    const cepLimpo = cep.replace(/\D/g, '')
    
    if (cepLimpo.length !== 8) {
      throw new Error('CEP inválido')
    }

    const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)
    
    if (response.data.erro) {
      throw new Error('CEP não encontrado')
    }

    return {
      cep: response.data.cep,
      street: response.data.logradouro,
      neighborhood: response.data.bairro,
      city: response.data.localidade,
      state: response.data.uf,
      complement: response.data.complemento,
    }
  } catch (error) {
    console.error('Erro ao buscar CEP:', error)
    throw error
  }
}
