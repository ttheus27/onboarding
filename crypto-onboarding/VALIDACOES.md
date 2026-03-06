# Guia de Validações com Yup

Este documento explica como as validações estão implementadas no projeto usando Yup.

## Estrutura

As validações estão centralizadas em `src/services/validators.js` e incluem:

### 1. Validação de Documentos

#### CNPJ
```javascript
function validarCNPJ(cnpj) {
  // Remove caracteres não numéricos
  // Valida dígitos verificadores
  // Rejeita CNPJs com todos os dígitos iguais
}
```

#### CPF
```javascript
function validarCPF(cpf) {
  // Remove caracteres não numéricos
  // Valida dígitos verificadores
  // Rejeita CPFs com todos os dígitos iguais
}
```

### 2. Schemas de Validação

#### registerSchema (Tela 1 - Registro da Empresa)
Valida os seguintes campos:
- `cnpj`: Obrigatório, formato válido
- `companyName`: Obrigatório, mínimo 3 caracteres
- `fantasyName`: Obrigatório
- `cryptos`: Obrigatório (BTC, ETH, USDC, USDT)
- `phone`: Obrigatório, formato (XX) XXXXX-XXXX
- `email`: Obrigatório, formato válido
- `password`: Obrigatório, mínimo 8 caracteres, 1 maiúscula, 1 número
- `passwordConfirm`: Deve coincidir com password

#### partnerSchema (Sócio Individual)
Valida os seguintes campos:
- `fullName`: Obrigatório, mínimo 3 caracteres, apenas letras
- `cpf`: Obrigatório, formato válido
- `cep`: Obrigatório, formato XXXXX-XXX
- `street`: Obrigatório
- `number`: Obrigatório
- `complement`: Opcional
- `neighborhood`: Obrigatório
- `city`: Obrigatório
- `state`: Obrigatório, 2 caracteres (UF)
- `nationality`: Obrigatório
- `participation`: Obrigatório, entre 0.01 e 100
- `isPep`: Obrigatório (boolean)
- `documents`: Array obrigatório, mínimo 1 documento

#### partnersListSchema (Lista Completa de Sócios)
Valida:
- Array de sócios (mínimo 1)
- Soma das participações deve ser exatamente 100%
- Cada sócio deve passar na validação do `partnerSchema`

## Como Usar

### Validação Completa do Formulário

```javascript
import { registerSchema } from '@/services/validators'

async function handleSubmit() {
  const errors = {}
  
  try {
    await registerSchema.validate(formData, { abortEarly: false })
    // Dados válidos, prosseguir
  } catch (err) {
    // abortEarly: false retorna TODOS os erros
    err.inner.forEach((e) => {
      errors[e.path] = e.message
    })
    // Exibir erros
  }
}
```

### Validação de Campo Individual

```javascript
import { validateField, registerSchema } from '@/services/validators'

async function validateEmail() {
  const error = await validateField(registerSchema, 'email', email.value)
  if (error) {
    errors.value.email = error
  }
}
```

### Validação com Helper

```javascript
import { validateAll, registerSchema } from '@/services/validators'

async function handleSubmit() {
  const errors = await validateAll(registerSchema, formData)
  
  if (Object.keys(errors).length > 0) {
    // Tem erros
    return
  }
  
  // Prosseguir
}
```

## Exemplo Completo - Tela de Sócios

```vue
<script setup>
import { ref } from 'vue'
import { partnerSchema, partnersListSchema } from '@/services/validators'

const currentPartner = ref({
  fullName: '',
  cpf: '',
  // ... outros campos
})

const partners = ref([])
const errors = ref({})

// Adicionar sócio
async function addPartner() {
  errors.value = {}
  
  try {
    await partnerSchema.validate(currentPartner.value, { abortEarly: false })
    partners.value.push({ ...currentPartner.value })
    resetForm()
  } catch (err) {
    err.inner.forEach((e) => {
      errors.value[e.path] = e.message
    })
  }
}

// Finalizar cadastro
async function finalize() {
  try {
    await partnersListSchema.validate({ partners: partners.value })
    // Prosseguir para próxima tela
  } catch (err) {
    alert(err.message) // Ex: "A soma das participações deve ser 100%"
  }
}
</script>
```

## Mensagens de Erro Personalizadas

Todas as mensagens estão em português e são claras:
- "CNPJ inválido"
- "CPF inválido"
- "As senhas não coincidem"
- "A soma das participações deve ser exatamente 100%"
- "Adicione pelo menos um sócio"

## Integração com Pinia

O store salva automaticamente os dados no localStorage:

```javascript
import { useOnboardingStore } from '@/stores/onboarding'

const store = useOnboardingStore()

// Salvar após validação
store.saveToStorage()

// Carregar ao montar componente
onMounted(() => {
  store.loadFromStorage()
})

// Limpar ao finalizar
store.clearStorage()
```

## Requisitos Atendidos

✅ **Requisito 3**: Validação com Yup implementada
- Campos obrigatórios bloqueiam progresso
- CPF e CNPJ validados
- Cache com Pinia (localStorage)
- Dados persistem após refresh
- Cache limpo ao finalizar

✅ Validações adicionais:
- Força da senha
- Soma de participação = 100%
- Formato de telefone, email, CEP
- Upload de múltiplos documentos
