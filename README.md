# Banco do Murilo

App para registrar gastos, separar dinheiro em potes com metas, controlar cartões e planejar o mês.
Funciona no celular e no PC, dá para instalar como app e funciona sem internet.
Com o Supabase configurado, você entra com e-mail e senha e os dados sincronizam entre os aparelhos.

É um site estático (HTML, CSS e JS puros): não tem build nem dependências para instalar.

## O que tem

- **Início:** saldo disponível, potes, patrimônio, previsão de saldo no fim do mês, alertas (conta vencendo, orçamento estourando, fatura, dívida combinada), gastos por categoria e últimos 6 meses.
- **Extrato:** busca em um mês ou em todos, filtros por tipo, categoria e conta, calendário de gastos por dia, exportação para CSV e importação de extrato do banco (OFX ou CSV) com categoria automática e detecção de repetidos.
- **Lançamentos:** despesa, receita e transferência; parcelamento; atalhos de um toque para o que você mais repete; contas no campo de valor (`12+8,50`, `3x25`); duplicar.
- **Potes:** metas com prazo, quanto guardar por mês, distribuir um valor entre vários potes por porcentagem, rendimento, simulador de juros compostos e confete quando bate a meta.
- **Planejar:** orçamento por categoria, fixos do mês (contas e receitas, com lançamento automático) e análise 50/30/20.
- **Cartões:** fatura aberta e fechada, limite usado, parcelas futuras, pagamento da fatura e aviso de vencimento.
- **Dívidas:** quem te deve e para quem você deve, com pagamentos parciais.
- **Relatórios:** evolução do patrimônio, entradas e saídas do ano, categorias comparadas com o ano anterior, maiores gastos e dia da semana em que você mais gasta.
- **Ajustes:** conta e sincronização, tema claro ou escuro, ocultar valores, contas, categorias, backup.

Atalhos no PC: `N` abre um novo lançamento e `/` vai para a busca do extrato.

## 1. Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Vá em **SQL Editor → New query**, cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   Isso cria a tabela `user_data` com as regras de segurança: cada pessoa só lê e altera os próprios dados.
3. Vá em **Project Settings → API** e copie a **Project URL** e a chave **anon public**.
4. Cole as duas em [`config.js`](config.js):

   ```js
   window.BANCO_CONFIG = {
     supabaseUrl: 'https://SEU-PROJETO.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...',
   };
   ```

   A chave anon é pública por natureza (ela vai para o navegador de qualquer jeito). Quem protege os dados é o RLS do schema.
   Nunca coloque a chave `service_role` aqui.

5. Em **Authentication → URL Configuration**, coloque o endereço do site na Vercel em **Site URL**
   (ex: `https://banco-do-murilo.vercel.app`) e também em **Redirect URLs**.
   Isso faz os links de confirmação de e-mail e de "esqueci minha senha" voltarem para o seu site.
6. Opcional: se não quiser confirmar o e-mail no cadastro, desligue **Authentication → Providers → Email → Confirm email**.

## 2. Publicar na Vercel

Pelo GitHub (recomendado):

1. Suba esta pasta para um repositório no GitHub.
2. Na Vercel, clique em **Add New → Project** e importe o repositório.
3. Em **Framework Preset**, escolha **Other**. Não precisa de build command nem de output directory.
4. Clique em **Deploy**.

Ou pela linha de comando, dentro desta pasta:

```bash
npx vercel --prod
```

## 3. Usar no celular

Abra o endereço da Vercel no celular e entre com a mesma conta.
Para virar app: no Android (Chrome), menu **⋮ → Instalar app**; no iPhone (Safari), **Compartilhar → Adicionar à Tela de Início**.

## Como os dados funcionam

- Tudo fica salvo no aparelho primeiro, então o app abre e funciona sem internet.
- Com login, cada alteração vai para o Supabase alguns instantes depois. O indicador de nuvem no topo mostra se está sincronizado.
- Se você mexer no celular e no PC ao mesmo tempo (ou offline), as alterações são mescladas: o que você mudou em cada aparelho é mantido.
- Tema e "ocultar valores" são de cada aparelho.
- Sem o `config.js` preenchido, o app funciona só no aparelho (sem login). Se depois você criar uma conta, os dados que já estavam ali vão junto.
- Em **Ajustes** dá para exportar um backup em JSON e uma planilha CSV a qualquer momento.

## Rodar no computador

Qualquer servidor estático serve, por exemplo:

```bash
npx http-server -p 5173 -c-1
```

Abrir o `index.html` direto também funciona, só sem o modo offline.
