# Integração da API de CNPJ

Este guia mostra como integrar a busca automática de dados da empresa pelo CNPJ.

## APIs Disponíveis

### 1. ReceitaWS (Implementada)
- ✅ Gratuita
- ✅ Sem necessidade de chave
- ⚠️ Limite: 3 requisições por minuto
- ✅ Retorna sócios (QSA)
- URL: `https://www.receitaws.com.br/v1/cnpj/{cnpj}`

### 2. BrasilAPI (Implementada como alternativa)
- ✅ Gratuita
- ✅ Sem limite de requisições
- ✅ Mais rápida
- ✅ Retorna sócios (QSA)
- URL: `https://brasilapi.com.br/api/cnpj/v1/{cnpj}`

## Como Integrar na Tela de Registro

### Passo 1: Importar o serviço

```vue
<script setup>
import { buscarCNPJ, buscarCNPJBrasilAPI } from '../services/cnpj.js'

const loadingCnpj = ref(false)
</script>
```

### Passo 2: Adicionar função de busca

```javascript
async function handleCnpjBlur() {
  const cnpjLimpo = company.value.cnpj.replace(/\D/g, '')
  
  if (cnpjLimpo.length !== 14) return
  
  loadingCnpj.value = true
  errors.value.cnpj = ''
  
  try {
    // Tenta BrasilAPI primeiro (sem limite)
    const data = await buscarCNPJBrasilAPI(company.value.cnpj)
    
    // Autocomplete dos campos
    company.value.companyName = data.razaoSocial
    company.value.fantasyName = data.nomeFantasia
    
    // Opcional: preencher telefone se disponível
    if (data.telefone) {
      company.value.phone = data.telefone
    }
    
    // Salvar sócios para a próxima tela
    if (data.socios && data.socios.length > 0) {
      // Armazena temporariamente para usar na tela de sócios
      localStorage.setItem('cnpj_socios', JSON.stringify(data.socios))
    }
    
    // Mostrar mensagem de sucesso
    console.log('✅ Dados da empresa carregados com sucesso!')
    
  } catch (error) {
    if (error.message.includes('não está ativa')) {
      errors.value.cnpj = error.message
      // Bloqueia o progresso
      company.value.companyName = ''
      company.value.fantasyName = ''
    } else {
      errors.value.cnpj = 'Erro ao buscar CNPJ. Verifique o número.'
    }
  } finally {
    loadingCnpj.value = false
  }
}
```

### Passo 3: Adicionar no template

```vue
<template>
  <!-- Campo CNPJ -->
  <div class="mb-3">
    <label class="form-label">CNPJ</label>
    <div class="input-icon-wrapper">
      <span class="input-icon">🏢</span>
      <input
        v-model="company.cnpj"
        type="text"
        class="form-control ps-5"
        placeholder="00.000.000/0000-00"
        maxlength="18"
        @input="formatCNPJ"
        @blur="handleCnpjBlur"
      />
      <!-- Indicador de loading -->
      <span v-if="loadingCnpj" class="spinner-border spinner-border-sm position-absolute end-0 me-3" style="top: 50%; transform: translateY(-50%)"></span>
    </div>
    <small class="text-danger" v-if="errors.cnpj">{{ errors.cnpj }}</small>
    <small class="text-success" v-if="!errors.cnpj && company.companyName">
      ✓ Empresa encontrada
    </small>
  </div>
</template>
```

## Integração na Tela de Sócios

### Carregar sócios do CNPJ

```vue
<script setup>
onMounted(() => {
  store.loadFromStorage()
  
  // Carrega sócios do CNPJ se disponível
  const sociosCnpj = localStorage.getItem('cnpj_socios')
  if (sociosCnpj && partners.value.length === 0) {
    const socios = JSON.parse(sociosCnpj)
    
    // Sugere os sócios para o usuário
    console.log('Sócios encontrados no CNPJ:', socios)
    
    // Opcional: pré-preencher com os nomes
    // (usuário ainda precisa completar CPF, endereço, etc.)
    socios.forEach(socio => {
      partners.value.push({
        fullName: socio.nome,
        cpf: '',
        cep: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        nationality: 'Brasileira',
        participation: 0, // Usuário define
        isPep: false,
        documents: [],
      })
    })
    
    // Limpa o cache
    localStorage.removeItem('cnpj_socios')
  }
})
</script>
```

## Exemplo de Resposta da API

### ReceitaWS
```json
{
  "status": "OK",
  "nome": "EMPRESA EXEMPLO LTDA",
  "fantasia": "EXEMPLO",
  "cnpj": "00.000.000/0001-00",
  "situacao": "ATIVA",
  "abertura": "01/01/2020",
  "logradouro": "RUA EXEMPLO",
  "numero": "123",
  "bairro": "CENTRO",
  "municipio": "SAO PAULO",
  "uf": "SP",
  "cep": "01234-567",
  "telefone": "(11) 1234-5678",
  "email": "contato@exemplo.com",
  "qsa": [
    {
      "nome": "JOAO DA SILVA",
      "qual": "Sócio-Administrador"
    },
    {
      "nome": "MARIA SANTOS",
      "qual": "Sócio"
    }
  ]
}
```

## Tratamento de Erros

### Empresa Inativa
```javascript
if (data.situacao !== 'ATIVA') {
  throw new Error(`Empresa não está ativa. Situação: ${data.situacao}`)
}
```

### Limite de Requisições (ReceitaWS)
```javascript
if (error.response?.status === 429) {
  errors.value.cnpj = 'Muitas requisições. Aguarde 1 minuto e tente novamente.'
}
```

### CNPJ Não Encontrado
```javascript
if (response.data.status === 'ERROR') {
  errors.value.cnpj = 'CNPJ não encontrado na Receita Federal'
}
```

## Validação de Situação Cadastral

Situações possíveis:
- ✅ `ATIVA` - Permitir cadastro
- ❌ `SUSPENSA` - Bloquear
- ❌ `INAPTA` - Bloquear
- ❌ `BAIXADA` - Bloquear
- ❌ `NULA` - Bloquear

## Melhorias Sugeridas

### 1. Debounce na busca
```javascript
import { debounce } from 'lodash-es'

const handleCnpjBlur = debounce(async () => {
  // busca...
}, 500)
```

### 2. Cache de CNPJs já buscados
```javascript
const cnpjCache = ref({})

if (cnpjCache.value[cnpjLimpo]) {
  // Usa cache
  const data = cnpjCache.value[cnpjLimpo]
} else {
  // Busca na API
  const data = await buscarCNPJ(cnpj)
  cnpjCache.value[cnpjLimpo] = data
}
```

### 3. Fallback entre APIs
```javascript
try {
  return await buscarCNPJBrasilAPI(cnpj)
} catch (error) {
  console.log('BrasilAPI falhou, tentando ReceitaWS...')
  return await buscarCNPJ(cnpj)
}
```

## Checklist de Implementação

- [ ] Importar serviço de CNPJ
- [ ] Adicionar `@blur` no campo CNPJ
- [ ] Implementar `handleCnpjBlur()`
- [ ] Autocomplete de razão social
- [ ] Autocomplete de nome fantasia
- [ ] Validar situação cadastral (apenas ATIVA)
- [ ] Bloquear progresso se inativa
- [ ] Salvar sócios para próxima tela
- [ ] Adicionar indicador de loading
- [ ] Adicionar mensagem de sucesso
- [ ] Tratar erros (404, 429, etc.)
- [ ] Testar com CNPJs reais

## CNPJs para Teste

CNPJs públicos para testar:
- `00.000.000/0001-91` - Banco do Brasil
- `33.000.167/0001-01` - Petrobras
- `60.701.190/0001-04` - Itaú

⚠️ Use apenas para testes, não para cadastros reais!
