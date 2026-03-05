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