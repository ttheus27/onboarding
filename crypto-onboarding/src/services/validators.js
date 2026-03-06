import * as yup from 'yup'

// Valida CNPJ
function validarCNPJ(cnpj) {
  cnpj = cnpj.replace(/\D/g, '')
  if (cnpj.length !== 14) return false
  if (/^(\d)\1+$/.test(cnpj)) return false

  let soma = 0
  let peso = [5,4,3,2,9,8,7,6,5,4,3,2]
  for (let i = 0; i < 12; i++) soma += parseInt(cnpj[i]) * peso[i]
  let resto = soma % 11
  let d1 = resto < 2 ? 0 : 11 - resto

  soma = 0
  peso = [6,5,4,3,2,9,8,7,6,5,4,3,2]
  for (let i = 0; i < 13; i++) soma += parseInt(cnpj[i]) * peso[i]
  resto = soma % 11
  let d2 = resto < 2 ? 0 : 11 - resto

  return parseInt(cnpj[12]) === d1 && parseInt(cnpj[13]) === d2
}

// Valida CPF
function validarCPF(cpf) {
  cpf = cpf.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1+$/.test(cpf)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf[i]) * (10 - i)
  let resto = soma % 11
  let d1 = resto < 2 ? 0 : 11 - resto

  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf[i]) * (11 - i)
  resto = soma % 11
  let d2 = resto < 2 ? 0 : 11 - resto

  return parseInt(cpf[9]) === d1 && parseInt(cpf[10]) === d2
}

// Schema de validação da Tela 1
export const registerSchema = yup.object({
  cnpj: yup
    .string()
    .required('CNPJ é obrigatório')
    .test('cnpj-valido', 'CNPJ inválido', (val) => validarCNPJ(val || '')),

  companyName: yup
    .string()
    .required('Razão social é obrigatória')
    .min(3, 'Mínimo 3 caracteres'),

  fantasyName: yup
    .string()
    .required('Nome fantasia é obrigatório'),

  cryptos: yup
    .string()
    .required('Selecione uma moeda'),

  phone: yup
    .string()
    .required('Telefone é obrigatório')
    .min(14, 'Telefone inválido'),

  email: yup
    .string()
    .required('E-mail é obrigatório')
    .email('E-mail inválido'),

  password: yup
    .string()
    .required('Senha é obrigatória')
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Precisa ter uma letra maiúscula')
    .matches(/[0-9]/, 'Precisa ter um número'),

  passwordConfirm: yup
    .string()
    .required('Confirme sua senha')
    .oneOf([yup.ref('password')], 'As senhas não coincidem'),
})

// Schema de validação para um sócio individual
export const partnerSchema = yup.object({
  fullName: yup
    .string()
    .required('Nome completo é obrigatório')
    .min(3, 'Mínimo 3 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]+$/, 'Nome deve conter apenas letras'),

  cpf: yup
    .string()
    .required('CPF é obrigatório')
    .test('cpf-valido', 'CPF inválido', (val) => validarCPF(val || '')),

  cep: yup
    .string()
    .required('CEP é obrigatório')
    .matches(/^\d{5}-?\d{3}$/, 'CEP inválido'),

  street: yup
    .string()
    .required('Logradouro é obrigatório'),

  number: yup
    .string()
    .required('Número é obrigatório'),

  complement: yup
    .string()
    .nullable(),

  neighborhood: yup
    .string()
    .required('Bairro é obrigatório'),

  city: yup
    .string()
    .required('Cidade é obrigatória'),

  state: yup
    .string()
    .required('Estado é obrigatório')
    .length(2, 'Use a sigla do estado (ex: SP)'),

  nationality: yup
    .string()
    .required('Nacionalidade é obrigatória'),

  participation: yup
    .number()
    .required('Participação é obrigatória')
    .min(0.01, 'Participação deve ser maior que 0')
    .max(100, 'Participação não pode exceder 100%'),

  isPep: yup
    .boolean()
    .required('Informe se é PEP'),

  documents: yup
    .array()
    .min(1, 'Anexe pelo menos um documento')
    .required('Documentos são obrigatórios'),
})

// Schema para validar a lista completa de sócios
export const partnersListSchema = yup.object({
  partners: yup
    .array()
    .of(partnerSchema)
    .min(1, 'Adicione pelo menos um sócio')
    .test(
      'soma-participacao',
      'A soma das participações deve ser exatamente 100%',
      (partners) => {
        if (!partners || partners.length === 0) return false
        const total = partners.reduce((sum, p) => sum + (p.participation || 0), 0)
        return Math.abs(total - 100) < 0.01 // Tolerância para arredondamento
      }
    ),
})


// Helper para validar um campo individual
export async function validateField(schema, fieldName, value) {
  try {
    await schema.validateAt(fieldName, { [fieldName]: value })
    return null // Sem erro
  } catch (error) {
    return error.message
  }
}

// Helper para validar todos os campos e retornar objeto de erros
export async function validateAll(schema, data) {
  try {
    await schema.validate(data, { abortEarly: false })
    return {} // Sem erros
  } catch (err) {
    const errors = {}
    err.inner.forEach((e) => {
      errors[e.path] = e.message
    })
    return errors
  }
}
