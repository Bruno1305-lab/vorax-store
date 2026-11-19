# VØRAX — loja virtual starter

Projeto inicial de loja virtual com identidade visual VØRAX.

## O que já está preparado
- Layout responsivo com catálogo e página de produto
- Carrinho salvo no navegador
- Checkout que monta o pedido e abre conversa no WhatsApp
- Integração preparada com Supabase: cadastro/login, produtos, avaliações, pedidos e chat
- Painel de administração protegido por perfil `admin`
- SQL com tabelas e políticas de segurança (RLS)

## Importante antes de publicar
O projeto começa em modo demonstração. Para ativar banco, login, chat, avaliações e painel, configure o Supabase seguindo os passos abaixo. O checkout encaminha o pedido pelo WhatsApp; não processa cartão ou Pix automaticamente.

## 1. Criar o Supabase
1. Acesse https://supabase.com/ e crie uma conta gratuita.
2. Crie um projeto e guarde a senha do banco em local seguro.
3. Abra SQL Editor > New query.
4. Copie todo o conteúdo de `supabase.sql`, cole e clique em Run.
5. Em Project Settings > API, copie Project URL e `anon` / publishable key.
6. No arquivo `app.js`, substitua `COLE_SUA_SUPABASE_URL` e `COLE_SUA_CHAVE_ANON`.
7. Nunca coloque `service_role` ou segredo privado no JavaScript do site.

## 2. Ativar chat em tempo real
No painel Supabase, abra Database > Replication (ou Publications) e habilite a tabela `chat_messages` para `supabase_realtime`.

## 3. Tornar sua conta administradora
1. Cadastre sua conta pelo site depois de configurar o Supabase.
2. No Supabase, abra Authentication > Users e copie o UUID da sua conta.
3. No SQL Editor execute, trocando o UUID:
   `update public.profiles set role = 'admin' where id = 'UUID_DA_SUA_CONTA';`
4. Saia e entre novamente no site. Clique em MINHA CONTA para abrir o painel.

## 4. Configurar WhatsApp
No início do `app.js`, altere `55DDDNUMERO` para seu número com código do país e DDD, apenas números.
Exemplo fictício: `5547999999999`.

## 5. Adicionar produtos
Pelo painel administrativo, informe nome, preço, categoria, descrição e URL de uma imagem pública. Para uma loja real, prefira enviar as fotos para Supabase Storage e usar URLs públicas do bucket.

## 6. Publicar gratuitamente
Use Cloudflare Pages:
1. Crie uma conta em https://github.com/ e um repositório novo chamado `vorax-store`.
2. Envie os arquivos desta pasta para o repositório (Add file > Upload files).
3. Crie conta em https://dash.cloudflare.com/.
4. Vá em Workers & Pages > Create > Pages > Connect to Git.
5. Autorize o GitHub e selecione `vorax-store`.
6. Como é um site estático simples, deixe o comando de build vazio e a pasta de saída como `/` (ou raiz do projeto, conforme a tela).
7. Clique em Save and Deploy. O Cloudflare fornecerá um endereço `*.pages.dev`.

## 7. Antes de vender de verdade
- Faça pedidos e testes usando uma conta de cliente e outra de administrador.
- Configure política de privacidade, termos, frete, trocas/devoluções e dados de contato.
- Não colete dados de cartão neste site. Use um gateway de pagamento confiável quando quiser Pix/cartão.
- O SQL inicial é uma base de partida: revise permissões e fluxos de pedidos antes de operar comercialmente.
- O plano gratuito do Supabase tem limites e pode pausar projetos inativos. Faça backup dos dados importantes.
- Domínio próprio (ex.: vorax.com.br) normalmente tem custo de registro.

## Estrutura
- `index.html`: páginas e modais
- `style.css`: identidade visual responsiva
- `app.js`: lógica da loja e conexão Supabase
- `supabase.sql`: estrutura do banco e regras de acesso
