// Exemplos de uso das validações
// Este arquivo é apenas para referência e testes

import { 
  registerSchema, 
  partnerSchema, 
  partnersListSchema,
  validateAll 
} from './src/services/validators.js'

// ============================================
// EXEMPLO 1: Validar dados da empresa
// ============================================

async function exemploValidarEmpresa() {
  const dadosEmpresa = {
    cnpj: '11.222.333/0001-81',
    companyName: 'Empresa Teste LTDA',
    fantasyName: 'Teste',
    cryptos: 'BTC',
    phone: '(11) 98765-4321',
    email: 'contato@empresa.com',
    password: 'Senha123',
    passwordConfirm: 'Senha123',
  }

  const errors = await validateAll(registerSchema, dadosEmpresa)
  
  if (Object.keys(errors).length > 0) {
    console.log('❌ Erros encontrados:', errors)
  } else {
    console.log('✅ Dados da empresa válidos!')
  }
}

// ============================================
// EXEMPLO 2: Validar sócio individual
// ============================================

async function exemploValidarSocio() {
  const socio = {
    fullName: 'João da Silva',
    cpf: '123.456.789-09',
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: 'Sala 10',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    nationality: 'Brasileira',
    participation: 50,
    isPep: false,
    documents: [
      { name: 'rg-frente.jpg', size: 1024 },
      { name: 'rg-verso.jpg', size: 1024 }
    ],
  }

  try {
    await partnerSchema.validate(socio, { abortEarly: false })
    console.log('✅ Dados do sócio válidos!')
  } catch (err) {
    console.log('❌ Erros encontrados:')
    err.inner.forEach(e => console.log(`  - ${e.path}: ${e.message}`))
  }
}

// ============================================
// EXEMPLO 3: Validar lista de sócios
// ============================================

async function exemploValidarListaSocios() {
  const socios = [
    {
      fullName: 'João da Silva',
      cpf: '123.456.789-09',
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      nationality: 'Brasileira',
      participation: 60,
      isPep: false,
      documents: [{ name: 'rg.jpg', size: 1024 }],
    },
    {
      fullName: 'Maria Santos',
      cpf: '987.654.321-00',
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '2000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      nationality: 'Brasileira',
      participation: 40,
      isPep: false,
      documents: [{ name: 'cnh.jpg', size: 1024 }],
    },
  ]

  try {
    await partnersListSchema.validate({ partners: socios })
    console.log('✅ Lista de sócios válida! Soma = 100%')
  } catch (err) {
    console.log('❌ Erro:', err.message)
  }
}

// ============================================
// EXEMPLO 4: Testar erro de participação
// ============================================

async function exemploErroParticipacao() {
  const socios = [
    {
      fullName: 'João da Silva',
      cpf: '123.456.789-09',
      cep: '01310-100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: '',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      nationality: 'Brasileira',
      participation: 50, // Soma = 50% (deveria ser 100%)
      isPep: false,
      documents: [{ name: 'rg.jpg', size: 1024 }],
    },
  ]

  try {
    await partnersListSchema.validate({ partners: socios })
    console.log('✅ Válido')
  } catch (err) {
    console.log('❌ Erro esperado:', err.message)
    // Deve mostrar: "A soma das participações deve ser exatamente 100%"
  }
}

// ============================================
// EXEMPLO 5: Testar CPF inválido
// ============================================

async function exemploErroDocumento() {
  const socio = {
    fullName: 'João da Silva',
    cpf: '111.111.111-11', // CPF inválido (todos dígitos iguais)
    cep: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    complement: '',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    nationality: 'Brasileira',
    participation: 100,
    isPep: false,
    documents: [{ name: 'rg.jpg', size: 1024 }],
  }

  try {
    await partnerSchema.validate(socio)
    console.log('✅ Válido')
  } catch (err) {
    console.log('❌ Erro esperado:', err.message)
    // Deve mostrar: "CPF inválido"
  }
}

// ============================================
// EXEMPLO 6: Validação em tempo real (campo por campo)
// ============================================

async function exemploValidacaoTempReal() {
  const registerSchema = registerSchema
  
  // Validar apenas o email
  try {
    await registerSchema.validateAt('email', { email: 'email-invalido' })
    console.log('✅ Email válido')
  } catch (err) {
    console.log('❌ Email inválido:', err.message)
  }

  // Validar apenas a senha
  try {
    await registerSchema.validateAt('password', { password: '123' })
    console.log('✅ Senha válida')
  } catch (err) {
    console.log('❌ Senha inválida:', err.message)
  }
}

// ============================================
// EXECUTAR EXEMPLOS
// ============================================

console.log('=== TESTES DE VALIDAÇÃO ===\n')

console.log('1. Validar Empresa:')
await exemploValidarEmpresa()

console.log('\n2. Validar Sócio:')
await exemploValidarSocio()

console.log('\n3. Validar Lista de Sócios (100%):')
await exemploValidarListaSocios()

console.log('\n4. Erro de Participação:')
await exemploErroParticipacao()

console.log('\n5. Erro de CPF:')
await exemploErroDocumento()

console.log('\n6. Validação em Tempo Real:')
await exemploValidacaoTempReal()
