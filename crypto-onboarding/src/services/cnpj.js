import axios from 'axios'

/**
 * Busca dados da empresa pelo CNPJ usando ReceitaWS
 * API gratuita, sem necessidade de chave
 * Limite: 3 requisições por minuto
 * 
 * @param {string} cnpj - CNPJ no formato 00.000.000/0000-00 ou 00000000000000
 * @returns {Promise<Object>} Dados da empresa
 */
export async function buscarCNPJ(cnpj) {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido')
    }

    // API ReceitaWS - Gratuita
    const response = await axios.get(`https://www.receitaws.com.br/v1/cnpj/${cnpjLimpo}`)
    
    if (response.data.status === 'ERROR') {
      throw new Error(response.data.message || 'CNPJ não encontrado')
    }

    // Verifica se a empresa está ativa
    if (response.data.situacao !== 'ATIVA') {
      throw new Error(`Empresa não está ativa. Situação: ${response.data.situacao}`)
    }

    // Extrai sócios (QSA = Quadro de Sócios e Administradores)
    const socios = (response.data.qsa || []).map(socio => ({
      nome: socio.nome,
      qualificacao: socio.qual,
      // A API não retorna CPF por questões de privacidade
    }))

    return {
      cnpj: response.data.cnpj,
      razaoSocial: response.data.nome,
      nomeFantasia: response.data.fantasia || response.data.nome,
      situacao: response.data.situacao,
      dataAbertura: response.data.abertura,
      naturezaJuridica: response.data.natureza_juridica,
      
      // Endereço
      cep: response.data.cep?.replace(/\D/g, ''),
      logradouro: response.data.logradouro,
      numero: response.data.numero,
      complemento: response.data.complemento,
      bairro: response.data.bairro,
      municipio: response.data.municipio,
      uf: response.data.uf,
      
      // Contato
      telefone: response.data.telefone,
      email: response.data.email,
      
      // Sócios
      socios: socios,
      
      // Capital social
      capitalSocial: response.data.capital_social,
    }
  } catch (error) {
    console.error('Erro ao buscar CNPJ:', error)
    
    if (error.response?.status === 429) {
      throw new Error('Limite de requisições excedido. Aguarde 1 minuto.')
    }
    
    throw error
  }
}

/**
 * Alternativa: BrasilAPI (mais rápida, sem limite de requisições)
 * Porém retorna menos informações
 */
export async function buscarCNPJBrasilAPI(cnpj) {
  try {
    const cnpjLimpo = cnpj.replace(/\D/g, '')
    
    const response = await axios.get(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`)
    
    if (response.data.descricao_situacao_cadastral !== 'ATIVA') {
      throw new Error(`Empresa não está ativa. Situação: ${response.data.descricao_situacao_cadastral}`)
    }

    const socios = (response.data.qsa || []).map(socio => ({
      nome: socio.nome_socio,
      qualificacao: socio.qualificacao_socio,
    }))

    return {
      cnpj: response.data.cnpj,
      razaoSocial: response.data.razao_social,
      nomeFantasia: response.data.nome_fantasia || response.data.razao_social,
      situacao: response.data.descricao_situacao_cadastral,
      dataAbertura: response.data.data_inicio_atividade,
      naturezaJuridica: response.data.natureza_juridica,
      
      // Endereço
      cep: response.data.cep?.replace(/\D/g, ''),
      logradouro: response.data.logradouro,
      numero: response.data.numero,
      complemento: response.data.complemento,
      bairro: response.data.bairro,
      municipio: response.data.municipio,
      uf: response.data.uf,
      
      // Contato
      telefone: response.data.ddd_telefone_1,
      email: response.data.email || '',
      
      // Sócios
      socios: socios,
      
      // Capital social
      capitalSocial: response.data.capital_social,
    }
  } catch (error) {
    console.error('Erro ao buscar CNPJ (BrasilAPI):', error)
    throw error
  }
}
