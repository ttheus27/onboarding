# 🚀 Guia Rápido: Configurar Gemini API

## Passo 1: Obter Chave de API

1. Acesse: https://aistudio.google.com/app/apikey
2. Faça login com sua conta Google
3. Clique em **"Create API Key"**
4. Copie a chave (começa com `AIza...`)

## Passo 2: Configurar no Projeto

1. Abra o arquivo `.env` na raiz do projeto `crypto-onboarding/`
2. Cole sua chave:

```env
VITE_GEMINI_API_KEY=AIzaSy...sua_chave_aqui
```

3. Salve o arquivo

## Passo 3: Reiniciar Servidor

```bash
# Pare o servidor (Ctrl+C)
# Inicie novamente:
npm run dev
```

## Passo 4: Testar

1. Acesse o onboarding
2. Preencha os dados da empresa
3. Cadastre os sócios
4. Faça upload de um contrato PDF
5. Clique em **"Analisar Contrato com IA"**
6. Aguarde ~2-4 segundos
7. Veja o resultado!

---

## ⚠️ Importante

- **NÃO commite o arquivo `.env`** (já está no .gitignore)
- A chave é pessoal e não deve ser compartilhada
- Limite grátis: 1500 requisições/dia

---

## 🐛 Problemas?

### Erro: "Chave de API não configurada"
- Verifique se o arquivo `.env` existe
- Verifique se a chave está correta
- Reinicie o servidor

### Erro: "API key not valid"
- Chave inválida ou expirada
- Gere uma nova chave no AI Studio

### Erro: "Quota exceeded"
- Limite de 1500 req/dia atingido
- Aguarde 24h ou use outra conta

---

## 📝 Exemplo de `.env`

```env
# Google AI Studio (Gemini) API Key
VITE_GEMINI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Pronto! 🎉
