# memi.art.br — Status do Projeto

> Última atualização: 2026-06-23 (sessão 3)

---

## O que foi feito

### Site (GitHub Pages)
- [x] `index.html` — storefront completo: hero, catálogo, carrinho lateral, footer
- [x] `products.json` — 5 adesivos (Cafézinho, Tropical Vibes, Arte de Rua, Natureza BR, Pixelado)
- [x] `cart.js` — carrinho com localStorage, cálculo de total, redirect para checkout
- [x] `style.css` — design mobile-first, identidade visual memi (preto, laranja #ff3c00, amarelo #ffe600)
- [x] `obrigado.html` — página pós-compra com evento `purchase` no dataLayer
- [x] `CNAME` — `www.memi.art.br` apontando para GitHub Pages
- [x] Deploy ativo em `https://www.memi.art.br`

### Tracking (via GTM `GTM-ND59FKD9`)
- [x] GTM instalado no `<head>` e `<body>` do `index.html` e `obrigado.html`
- [x] **GA4** — Measurement ID `G-LK8G7VJ2GV` publicado no GTM (tag "GA4 - memi.art.br")
- [x] **Microsoft Clarity** — Project ID `xbnogec5nh` publicado no GTM
- [x] Eventos dataLayer implementados: `view_item`, `add_to_cart`, `begin_checkout`, `purchase`
- [x] GTM versão 3 publicada e ativa

### Pagamentos (Mercado Pago)
- [x] Conta MP criada e logada (modo sandbox)
- [x] Aplicação MP criada — Public Key e Access Token gerados
- [x] Arquitetura segura: Access Token **nunca** vai para o repositório público
- [x] `cart.js` envia itens para webhook do n8n (não diretamente para a API do MP)

### Backend (n8n no Railway)
- [x] n8n self-hosted deployado no Railway (projeto "empathetic-success")
  - URL: `https://n8n-production-7c86.up.railway.app`
- [x] PostgreSQL conectado ao n8n (persistência de workflows e execuções)
- [x] Variáveis de ambiente configuradas no Railway:
  - `MP_ACCESS_TOKEN` — token sandbox do Mercado Pago
  - `N8N_BLOCK_ENV_ACCESS_IN_NODE=false` — permite `$env.*` nos nodes
  - `WEBHOOK_URL` — URL pública do n8n
- [x] **Workflow "Checkout MP"** criado e ativo:
  - Webhook: `POST /webhook/checkout`
  - Node HTTP Request: cria preferência no MP com o Access Token serverside
  - Payload inclui `back_urls`, `auto_return`, `statement_descriptor`, `external_reference` e **`notification_url`** → `https://n8n-production-7c86.up.railway.app/webhook/mp-notificacao`
  - Responde com `{ init_point: "..." }` para o browser redirecionar
- [x] **Workflow "MP Notificacao"** criado e ativo (ID: `s85OBgKauNdLIzks`):
  - Webhook: `POST /webhook/mp-notificacao` (resposta imediata 200 — MP não retry)
  - Node HTTP Request: busca detalhes do pagamento via `GET /v1/payments/{id}`
  - Node IF: filtra `status == "approved"` (branch true → emails)
  - Node "Email Confirmacao Cliente": POST Resend API → email HTML para `payer.email` com resumo do pedido
  - Node "Email Grafica Novo Pedido": POST Resend API → email para `bolivar@alencastro.com.br` com dados do pedido
- [x] **RESEND_API_KEY** configurada no Railway (domínio `memi.art.br` verificado na Resend)

### Teste ponta-a-ponta
- [x] `curl POST /webhook/checkout` → retorna `init_point` válido do MP sandbox
- [x] Fluxo completo: browser → n8n → MP API → redirect para checkout

---

## O que falta fazer

### Meta Pixel (Fase 1 — Tracking)
- [ ] **BLOQUEADO**: Login no Facebook requer WhatsApp 2FA (código não chega)
- [ ] Criar conta no **Meta Business Manager** (business.facebook.com)
- [ ] Criar **Pixel do Facebook/Instagram**
- [ ] Adicionar pixel via GTM (nova tag HTML personalizado, trigger: All Pages)
- [ ] Testar com Meta Pixel Helper

### Mercado Pago — Produção
- [ ] Migrar de sandbox para produção (trocar `MP_ACCESS_TOKEN` no Railway pela chave de produção)
- [ ] Configurar **webhook do MP** apontando para o n8n:
  - URL: `https://n8n-production-7c86.up.railway.app/webhook/mp-notificacao`
  - Eventos: `payment`, `merchant_order`

### n8n — Workflows de Automação

#### Workflow 1 — Novo pedido aprovado (completo v1)
- [x] Webhook `POST /webhook/mp-notificacao` recebe notificação do MP
- [x] Busca detalhes do pagamento via API do MP
- [x] Filtra `status == "approved"`
- [x] **Email confirmação ao cliente** via Resend — HTML com nome, itens, total, link para loja
- [x] **Email novo pedido para gráfica** via Resend → `bolivar@alencastro.com.br` (trocar pelo email da gráfica quando definida)
- [ ] Registrar pedido no **Google Sheets** (planilha "Pedidos memi") — requer OAuth Google

#### Workflow 2 — Personalização com Claude (próxima fase)
- [ ] **Claude API** (`claude-haiku-4-5`) → reescrever corpo do email com linguagem personalizada
- [ ] Integrar como node entre IF e Email Confirmacao Cliente

#### Workflow 3 — Conteúdo para Instagram (semanal)
- [ ] Trigger: Cron toda segunda-feira às 9h
- [ ] Busca produtos do `products.json` (GitHub API ou fixo)
- [ ] **Claude API** (`claude-sonnet-4-6`) → gera 3 posts (caption + hashtags + sugestão de imagem)
- [ ] Salva na planilha "Fila de Posts" no Google Sheets
- [ ] (Opcional futuro) Meta Content Publishing API para agendar posts

#### Workflow 4 — Relatório semanal
- [ ] Trigger: Cron todo domingo às 20h
- [ ] Busca dados da semana na **GA4 Data API** (sessões, add_to_cart, conversões, receita)
- [ ] **Claude API** → analisa dados e gera resumo com insights e sugestões
- [ ] Envia relatório por email para `bolivar@alencastro.com.br`

### Presença Social
- [ ] Criar **conta Instagram Business** (`@memi.art.br`)
- [ ] Criar **página Facebook** (`facebook.com/memi.art.br`)
- [ ] Vincular ao Meta Business Suite
- [ ] Configurar **link na bio** do Instagram → `https://memi.art.br`
- [ ] (Futuro) Instagram Shopping — botão "Comprar" nos posts

### Conteúdo e Imagens
- [ ] Criar artes reais dos adesivos (substituir emojis placeholder)
- [ ] Fotografar ou ilustrar produtos para as cards do catálogo
- [ ] OG Image para compartilhamento no WhatsApp/redes sociais

### Operacional
- [ ] Escolher e fechar contrato com **gráfica** (impressão + entrega direta)
- [ ] Definir fluxo de fulfillment: pedido aprovado → n8n notifica gráfica → gráfica envia
- [ ] Política de troca/devolução (texto para o site)
- [ ] Página de contato ou WhatsApp de atendimento

---

## Referências rápidas

| Recurso | URL / ID |
|---------|----------|
| Site | `https://www.memi.art.br` |
| Repositório | `github.com/bolivaralencastro/memi-art-br` |
| GTM Container | `GTM-ND59FKD9` |
| GA4 | `G-LK8G7VJ2GV` |
| Clarity | `xbnogec5nh` |
| n8n | `https://n8n-production-7c86.up.railway.app` |
| Railway Project | `a93edf18-b21c-4939-879f-776ceeb7736e` |
| MP Sandbox Public Key | `APP_USR-a9d45349-5558-4061-9944-012445877eaf` |
| Webhook checkout | `POST https://n8n-production-7c86.up.railway.app/webhook/checkout` |
| Webhook notificação MP | `POST https://n8n-production-7c86.up.railway.app/webhook/mp-notificacao` |
