

Projeto de desenvolvimento de um Onbording mobile-first para abertura de contas PJ em uma corretora de cripytoativo.
Stack que sao obrigatorias:
Vue 3 + Composition API, Pinia, Bootstrap 5, SASS, Yup


Paletas de cores versao light(cores da transferbank)
// Fundos
$bg-primary:  #FFFFFF;
$bg-card:     #F8F9FA;
$bg-surface:  #F1F3F5;

// Acentos
$accent-primary:   #00C9B1;  // teal
$accent-secondary: #7B2FBE;  // roxo

// Texto
$text-primary: #1A1A2E;
$text-muted:   #6B7280;

// Feedback
$success: #10B981;
$danger:  #EF4444;
$warning: #F59E0B;

// Overrides Bootstrap
$primary:                  $accent-primary;
$body-bg:                  $bg-primary;
$body-color:               $text-primary;
$border-radius:            12px;
$font-family-sans-serif:   'Inter', sans-serif;
$input-bg:                 $bg-surface;
$input-color:              $text-primary;
$input-border-color:       #E2E8F0;
$input-focus-border-color: $accent-primary;


Com uma estrutura de pastas baseado no "Feature-based structure"


Tendo alguns requisitos obrigatorios e outros opcionais

Req 1 — UX com IA (opcional)
Usar ferramenta como UX Pilot para gerar design. Usar nano banana para logo.


Propt usado para gerar desing

´´´Faça uma tela de  inicial de registro, onde é requisitado o CNPJ, nome da empresa, nome fantasia, Moeda cripto que deseja operar (BTC, ETH, USDC, USDT), telefone com DDD, email, senha e confirmação de senha.
seria esses o campo da cript seria um drop e nao um botao de escolha, 

devera seguir mais ou menos esse padrao de cores

Fundo navbar/rodapé#2D1B4E (roxo escuro)Botão "Criar Conta"#00C9B1 (teal/verde água)Texto escuro#1A0A3B (roxo muito escuro)Destaque link#00C9B1 (mesmo teal)Fundo página#FFFFFF
Na parte superior crie uma barra para o progresso de registro, mostrando qual parte o usuario esta,
a pagina contem somente para registro

Crie uma outra tela 
Tela para registro de sócios (para simplificar só PF): A tela deverá pedir nome completo, CPF, endereço completo, nacionalidade e participação do sócio, se é PEP, e permitir anexo de múltiplos documentos (Ex: identidade frente e verso, cnh frente e verso)

Faça uma outra tela, so que separada do fluxo que estamos estabelecendo
Tela para conta já existente. Ela sempre deverá aparecer quando o e-mail 
Sa uma tela onde usuario podera recuperar senhar, ou entrar apatir daquela tela

Para esse caso, crie uma outra tela de formato de login ´´´

gerando esse resultado:
![alt text](image.png)


Req 2 — Telas (OBRIGATÓRIO)

Tela A: CNPJ, razão social, nome fantasia, criptos, telefone, e-mail, senha com indicador de força
Tela B: "Conta já existente" — aparece quando e-mail exists@transferpay.exchange é usado
Tela C: Sócios — nome, CPF, endereço, nacionalidade, participação %, PEP, upload docs (drag n drop). Participação deve somar 100%.
Tela D: Upload PDF contrato social + preview

Req 3 — Validação e Cache (OBRIGATÓRIO)

Yup para validar todos os campos (CPF, CNPJ, e-mail, senha, obrigatórios)
Não permite avançar com campos inválidos
Pinia + localStorage para cachear dados entre refreshes
Limpar cache ao finalizar onboarding

Req 4 — Autocomplete por CNPJ e CEP (OBRIGATÓRIO)

API BrasilAPI: preenche razão social, fantasia, sócios automaticamente
Bloquear empresas com situação diferente de "ATIVA"
API ViaCEP: autocomplete de endereço a partir do CEP

Req 5 — DDD → Estado + Bandeira (opcional, PRIORIZADO)

Ao digitar o telefone, identificar o estado pelo DDD
Mostrar bandeira do estado ao lado do campo

Req 6 — Cotação de Moedas (opcional, PRIORIZADO)

Mostrar custo de setup da conta na tela 1
Calculado a partir de $100 USD, 0.00153 BTC ou 0.521 ETH
Exibir em reais com 2 casas decimais (arredondando pra cima)
Atualizar a cada 5 segundos
Aplicar 1% de spread + 3.5% de IOF

Fórmula:
custo_base = valor_em_USD × cotação_BRL_USD
com_spread = custo_base × 1.01
com_iof    = com_spread × 1.035
final      = ceil(com_iof × 100) / 100

Req 7 — Upload Contrato Social PDF (opcional, PRIORIZADO)

Tela para upload de PDF
Preview do PDF inline no navegador

Req 8 — IA para análise do contrato (opcional, PRIORIZADO)

OCR do PDF (Tesseract.js ou pdf.js)
Enviar texto extraído para LLM (OpenAI/Claude)
Verificar: sócios presentes, assinaturas, cláusulas essenciais
Lógica fuzzy para calcular índice de confiança
Reprovar cadastro se contrato não for confiável
