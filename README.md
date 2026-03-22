# TransferCripto — Onboarding PJ

> Protótipo de onboarding para abertura de conta PJ em uma corretora de criptoativos.

## Sobre o Projeto
Este projeto foi desenvolvido como resposta ao desafio técnico proposto, com o objetivo de criar um fluxo de onboarding intuitivo, responsivo e integrado a APIs reais, simulando o cadastro de uma empresa (Pessoa Jurídica) em uma corretora de criptoativos.

A experiência foi construída com foco em **UX mobile-first**, **validação inteligente de formulários** e **integração com serviços externos** como ViaCEP e ReceitaWS.

O uso de Agentes de IAs e ferramentas similares foram encorajados para a conclusao do desafio

---
Desing e UX

O layout e o fluxo de telas foram gerados com auxílio do UX Pilot, ferramenta de IA para design de interfaces.
Abaixo estão os prompts utilizados:

```
Faça uma tela inicial de registro, onde são requisitados os seguintes dados:
CNPJ, nome da empresa, nome fantasia, moeda cripto que deseja operar (BTC, ETH, USDC, USDT), telefone com DDD, e-mail, senha e confirmação de senha.
O campo de criptomoeda deve ser um dropdown (lista suspensa), e não botões de escolha.
A interface deverá seguir aproximadamente este padrão de cores:
Fundo da navbar/rodapé: #2D1B4E (roxo escuro)
Botão "Criar Conta": #00C9B1 (teal/verde-água)
Texto escuro: #1A0A3B (roxo muito escuro)
Destaque de link: #00C9B1 (mesmo teal)
Fundo da página: #FFFFFF
Na parte superior, crie uma barra de progresso do registro, mostrando em qual etapa do cadastro o usuário está.
A página deve conter apenas os elementos relacionados ao registro.
```

```
Crie outra tela.
Tela para registro de sócios: a tela deverá solicitar nome completo, CPF, endereço completo, nacionalidade e participação do sócio.
Deve haver também uma checkbox indicando se o sócio é PEP.
Inclua uma área para depósito/upload de arquivos. Logo abaixo, apresente uma lista dos documentos que foram enviados, com um ícone de lixeira ao lado para removê-los.
```
```
Crie outra tela, separada do fluxo de registro que estamos estabelecendo.
Essa tela será para conta já existente. Deve haver um aviso informando "Conta já existente".
Logo abaixo, inclua campos para e-mail e senha, além de um botão para recuperar a senha.

```

OBS: Os prompts foram melhorados com o chatGPT (GPT-5.3)

Logo gerada com o Nano Banana

-
![Foto Logo Projeto](./Coisas/Logo.png)
-

Prompt Utilizado:
```
Crie uma logo para um site de negociação de criptoativos. A logo deve ter alguma associação visual com a letra "B" do Bitcoin, podendo ser uma adaptação ou estilização desse símbolo.

O design deve transmitir tecnologia, segurança e modernidade.
Prefira um estilo minimalista e profissional, adequado para uso em um site e em uma navbar.

Utilize uma paleta de cores baseada em:

    Roxo escuro (#2D1B4E)

    Verde teal (#00C9B1)

    Branco (#FFFFFF)

A logo deve funcionar bem em fundo claro e escuro, ter boa legibilidade em tamanhos pequenos e possuir um visual moderno, relacionado ao universo de blockchain e criptomoedas.
```

----

## Stack Tecnológica

| Tecnologia | Versão | Motivo |
|-----------|--------|--------|
| **Vue 3** | ^3.4 | Composition API, reatividade moderna |
| **Pinia** | ^2.1 | Gerenciamento de estado simples e tipado |
| **Bootstrap 5** | ^5.3 | Grid responsivo mobile-first |
| **SASS** | ^1.7 | Customização de variáveis e temas |
| **Yup** | ^1.3 | Validação declarativa de schemas |
| **Vee-Validate** | ^4.x | Integração do Yup com Vue forms |
| **Vue Router** | ^4.x | Navegação entre etapas do onboarding |
| **Axios** | ^1.x | Requisições HTTP para APIs externas |


## Ferramentas Utilizadas

Kiro (Claude Sonnet 4.5)
IDE inteligente usada como agente de desenvolvimento: geração de componentes Vue, arquitetura do projeto, refatorações e revisão de código em tempo real 

Claude (Anthropic) 
Suporte a decisões de arquitetura, geração de schemas Yup, validações e lógica de negócio

ChatGPT (OpenAI)
Apoio na escrita de prompts, brainstorming de fluxo de UX e revisão de textos

UX Pilot
Geração do fluxo de UX e layout das telas mobile

Nano Banana(Google)
Criação da logo do projeto.

### Sobre o uso do **Kiro**
O Kiro foi utilizado como IDE inteligente principal durante o desenvolvimento, com o modelo Claude Sonnet 4.5 como agente de código. Ele foi especialmente útil para:

- Geração inicial dos componentes de cada etapa do onboarding
- Sugestões de estrutura de pastas e separação de responsabilidades
- Refatoração de código repetitivo (ex: campos de formulário)
- Revisão de integração entre Pinia store e componentes Vue


## APIs Integradas

| API | Endpoint | Finalidade |
|-----|----------|-----------|
| **ViaCEP** | `https://viacep.com.br/ws/{cep}/json/` | Preenchimento automático de endereço |
| **BrasilAPI** | `https://brasilapi.com.br/api/cnpj/v1/{cnpj}` | Busca de dados da empresa pelo CNPJ |
| **CoinGecko** | `https://api.coingecko.com/api/v3/simple/price` | Cotações de criptomoedas em tempo real |
| **AwesomeAPI** | `https://economia.awesomeapi.com.br/json/last/USD-BRL` | Cotação do dólar (alternativa) |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash` | Análise de contrato social com IA |

---

## Fórmula de Cálculo do Custo de Setup

O custo de setup da conta é calculado a partir dos valores base em criptomoedas, aplicando spread e IOF:

### Valores Base:
- **USD**: $100
- **BTC**: 0.00153 BTC
- **ETH**: 0.521 ETH
- **USDC/USDT**: $100 (stablecoins)

### Fórmula (LaTeX):

```latex
\text{custo\_base} = \text{valor\_em\_USD} \times \text{cotação\_BRL\_USD}

\text{com\_spread} = \text{custo\_base} \times 1.01

\text{com\_iof} = \text{com\_spread} \times 1.035

\text{final} = \left\lceil \text{com\_iof} \times 100 \right\rceil \div 100
```

### Explicação:
1. **custo_base**: Converte o valor da criptomoeda para reais usando a cotação atual
2. **com_spread**: Adiciona 1% de spread sobre o custo base
3. **com_iof**: Adiciona 3.5% de IOF sobre o valor com spread
4. **final**: Arredonda para cima com 2 casas decimais (favorece a empresa)

### Exemplo de Cálculo (BTC):
```
Cotação BTC: R$ 225.000,00
Valor base: 0.00153 BTC × R$ 225.000 = R$ 344,25
Com spread (1%): R$ 344,25 × 1.01 = R$ 347,69
Com IOF (3.5%): R$ 347,69 × 1.035 = R$ 359,86
Final (arredondado): R$ 359,86
```

A cotação é atualizada automaticamente a cada 5 segundos quando uma moeda é selecionada.

---

## Análise de Contrato com IA (Requisito 8)

O sistema utiliza o Google Gemini 1.5 Flash para analisar automaticamente o contrato social da empresa.

### Como Funciona:

1. **Upload do PDF**: Usuário faz upload do contrato social
2. **Análise com IA**: Gemini analisa o documento completo
3. **Validação de Critérios**:
   - Sócios presentes (peso 30%)
   - Assinatura válida (peso 25%)
   - Cláusulas essenciais (peso 25%)
   - Formato válido (peso 20%)
4. **Lógica Fuzzy**: Calcula índice de confiança (0-100%)
5. **Aprovação/Reprovação**: Índice >= 70% = Aprovado

### Lógica Fuzzy:

```
indice = (sociosPresentes × 30) + 
         (assinaturaValida × 25) + 
         (clausulasEssenciais × 25) + 
         (formatoValido × 20)

aprovado = indice >= 70
```

### Vantagens do Gemini:

- **Totalmente GRÁTIS** (1500 requisições/dia)
- **Aceita PDF direto** (sem OCR manual)
- **Alta precisão** em documentos brasileiros
- **Rápido** (~2-4 segundos)

### Limitações Conhecidas:

**CPF dos Sócios**: As APIs públicas de CNPJ (BrasilAPI/ReceitaWS) não retornam o CPF dos sócios por questões de privacidade (LGPD). A validação é feita principalmente pelo nome dos sócios. Se o usuário digitar o CPF manualmente, a IA também valida por CPF.

- **Com CPF**: Precisão ~98%
- **Sem CPF**: Precisão ~90% (valida apenas por nome)

Para mais detalhes, veja: `crypto-onboarding/contexto/NOTA_CPF_SOCIOS.md`

### Configuração:

1. Obtenha uma chave de API em: https://aistudio.google.com/app/apikey
2. Crie o arquivo `.env` na raiz do projeto:
   ```env
   VITE_GEMINI_API_KEY=sua_chave_aqui
   ```
3. A chave está protegida no `.gitignore`

---


## Demonstração
https://drive.google.com/file/d/16tQCgKl5ttEn6coNWMNCU8D0TRukorqd/view?usp=sharing