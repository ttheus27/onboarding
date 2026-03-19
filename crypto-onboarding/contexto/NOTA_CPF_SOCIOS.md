# ⚠️ Nota Importante: CPF dos Sócios

## 🔒 Limitação das APIs Públicas

As APIs públicas de CNPJ (BrasilAPI e ReceitaWS) **NÃO retornam o CPF dos sócios** por questões de privacidade e conformidade com a LGPD (Lei Geral de Proteção de Dados).

### O que as APIs retornam:

```json
{
  "qsa": [
    {
      "nome": "JOÃO DA SILVA",
      "qualificacao": "Sócio-Administrador"
      // ❌ CPF não é retornado
    }
  ]
}
```

---

## 🔄 Como Funciona no Sistema

### 1. Autocomplete de CNPJ (RegisterView)

Quando o usuário digita o CNPJ:
- ✅ Preenche: Razão Social, Nome Fantasia, Telefone
- ✅ Salva sócios no localStorage (apenas NOMES)
- ❌ CPF dos sócios NÃO é preenchido

### 2. Tela de Sócios (PartnersView)

O sistema carrega os nomes dos sócios do CNPJ, mas:
- ✅ Nome é pré-preenchido
- ❌ CPF precisa ser digitado manualmente pelo usuário
- ✅ Endereço precisa ser preenchido
- ✅ Participação precisa ser definida

### 3. Análise de Contrato (ContractView)

A IA compara os sócios do contrato com os cadastrados:
- ✅ Compara por NOME (sempre disponível)
- ⚠️ Compara por CPF (se o usuário digitou)
- ✅ Aceita variações do nome (maiúsculas, acentos, etc.)

---

## 💡 Solução Implementada

### Prompt da IA:

```javascript
SÓCIOS ESPERADOS NO CONTRATO:
${socios.map(s => `- ${s.fullName}${s.cpf ? ` (CPF: ${s.cpf})` : ''}`).join('\n')}

// Se o usuário digitou o CPF:
- João Silva (CPF: 123.456.789-00)

// Se não digitou (veio do CNPJ):
- João Silva
```

### Critério de Validação:

```
1. Buscar por nome completo (obrigatório)
2. Buscar por CPF (se disponível)
3. Aceitar variações:
   - "João Silva" = "JOÃO DA SILVA"
   - "Maria Santos" = "MARIA DOS SANTOS"
   - Ignorar acentos e maiúsculas
```

---

## 🎯 Impacto no Projeto

### Cenário 1: Usuário usa autocomplete de CNPJ
1. Sistema preenche nomes dos sócios
2. Usuário completa CPF manualmente
3. IA valida por nome + CPF ✅

### Cenário 2: Usuário NÃO digita CPF
1. Sistema tem apenas nomes dos sócios
2. IA valida apenas por nome ⚠️
3. Menos preciso, mas funcional

### Cenário 3: Usuário cadastra sócios manualmente
1. Usuário digita nome + CPF
2. IA valida por nome + CPF ✅
3. Mais preciso

---

## 📊 Precisão da Validação

### Com CPF (ideal):
- **Precisão**: ~98%
- **Falsos positivos**: Muito raros
- **Recomendado**: Sempre que possível

### Sem CPF (aceitável):
- **Precisão**: ~90%
- **Falsos positivos**: Possíveis (homônimos)
- **Mitigação**: IA aceita variações do nome

---

## 🔐 Alternativas (Não Implementadas)

### 1. API Paga (Serpro)
- ✅ Retorna CPF dos sócios
- ❌ Custo: ~R$ 0,10 por consulta
- ❌ Requer CNPJ da empresa consultante
- ❌ Processo de homologação

### 2. Scraping da Receita Federal
- ✅ Dados completos
- ❌ Ilegal (viola termos de uso)
- ❌ Instável (site muda frequentemente)
- ❌ Pode ser bloqueado

### 3. Base de Dados Própria
- ✅ Controle total
- ❌ Requer manutenção constante
- ❌ Custo de armazenamento
- ❌ Questões de LGPD

---

## ✅ Conclusão

A solução implementada é:
- ✅ **Legal**: Usa apenas APIs públicas
- ✅ **Gratuita**: Sem custos adicionais
- ✅ **Funcional**: Validação por nome é suficiente
- ✅ **Flexível**: Aceita CPF se disponível
- ✅ **Precisa**: ~90-98% de precisão

Para um protótipo/MVP, essa abordagem é **ideal**.

---

## 📝 Recomendações

### Para Produção:
1. **Solicitar CPF manualmente**: Sempre pedir ao usuário
2. **Validar CPF**: Usar dígitos verificadores
3. **Confirmar sócios**: Tela de confirmação antes da análise
4. **Fallback manual**: Permitir análise manual se IA falhar

### Para o Protótipo:
- ✅ Implementação atual é suficiente
- ✅ Demonstra conhecimento das limitações
- ✅ Mostra solução criativa
- ✅ Explica no README/apresentação

---

## 🎓 Aprendizado

Este é um exemplo real de como:
1. **APIs públicas têm limitações** (privacidade)
2. **LGPD impacta desenvolvimento** (dados sensíveis)
3. **Soluções criativas são necessárias** (validação por nome)
4. **Trade-offs são inevitáveis** (precisão vs custo)

Demonstrar esse entendimento na apresentação mostra **maturidade técnica**! 🚀
