# Nossa Sessão

Um site de filmes parecido com a Netflix, só que feito para duas pessoas. Vocês dois veem o mesmo catálogo, escolhem filmes, montam a fila e marcam o que já assistiram. Tudo fica salvo na nuvem (Firebase) e os pôsteres e informações vêm do TMDB.

Este guia leva você do zero até o site no ar. Faça um passo de cada vez.

---

## 0. Instalar o Node.js

Instale o Node.js LTS em https://nodejs.org e confira com `node -v` (precisa ser 20.19 ou mais novo).

---

## 1. Pegar a chave do TMDB

O TMDB é o site que fornece os dados dos filmes (pôsteres, sinopse, trailer).

1. Crie uma conta grátis em https://www.themoviedb.org
2. Entre em **Configurações → API** (https://www.themoviedb.org/settings/api).
3. Peça uma chave (tipo "Developer"/pessoal) e preencha o formulário.
4. Vão aparecer duas chaves. Você quer a **"Chave da API"** (a curta, com letras e números).
5. Não use o "Token de Leitura da API" (o enorme).
6. Guarde a chave curta. Ela vai no `VITE_TMDB_KEY`.

## 2. Criar o projeto no Firebase

O Firebase guarda os dados e hospeda o site. É grátis para esse uso.

1. Entre em https://console.firebase.google.com com sua conta Google.
2. Clique em **Adicionar projeto** e dê o nome `nossa-sessao`.
3. Pode desativar o Google Analytics. Termine a criação.

### 2.1 Ligar o login anônimo

O site entra sozinho, sem pedir login para ninguém. Para isso funcionar:

1. No menu da esquerda: **Build → Authentication → Começar**.
2. Aba **Sign-in method** → escolha **Anônimo** (Anonymous) → ative → **Salvar**.

### 2.2 Criar o banco de dados

1. Menu: **Build → Firestore Database → Criar banco de dados**.
2. Escolha o modo **produção**.
3. Em localização, escolha **southamerica-east1** (São Paulo).
4. Termine a criação. (As regras de segurança serão enviadas no passo 5, antes de criar a sala.)

### 2.3 Registrar o app web e copiar a configuração

1. Na página inicial do projeto, clique no ícone **`</>`** (Web).
2. Dê um apelido (ex.: `nossa-sessao-web`). Não precisa marcar o Hosting aqui.
3. Vai aparecer um bloco de código com `firebaseConfig`. Deixe essa tela aberta, você vai copiar de lá no próximo passo.

## 3. Preencher o arquivo `.env`

O `.env` é onde ficam suas chaves. Ele **nunca** vai para o GitHub.

1. Na pasta do projeto, copie o modelo:
   - Mac/Linux: `cp .env.example .env`
   - Windows (PowerShell): `copy .env.example .env`
2. Abra o `.env` e preencha, sem aspas e sem espaços:

| No `.env` | De onde vem |
| --- | --- |
| `VITE_TMDB_KEY` | A "Chave da API" do TMDB (passo 1) |
| `VITE_FIREBASE_API_KEY` | `apiKey` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

## 4. Instalar e entrar no Firebase

Rode no terminal, dentro da pasta do projeto, um comando por vez:

1. `npm install`
2. `npx firebase login` (abre o navegador; entre com a mesma conta do Firebase)
3. `npx firebase use --add`
   - Escolha o projeto `nossa-sessao`.
   - Quando pedir um apelido (alias), digite `default`.
   - Isso cria o arquivo `.firebaserc`. É normal ele aparecer.

## 5. Enviar as regras de segurança do banco

O banco novo (modo produção) bloqueia tudo até as regras serem enviadas. Faça isso **antes** do próximo passo.

1. Rode: `npx firebase deploy --only firestore:rules`
2. Espere aparecer "Deploy complete!".

## 6. Criar a sala com os filmes iniciais

1. Rode: `npm run seed`
2. Espere uns segundos. No final vão aparecer **dois links**:
   - **Link da amiga**: termina em `?sala=...`
   - **Seu link**: igual, mas com `&dono=...` no final
3. **Copie e salve os dois agora** (num bloco de notas). Eles não aparecem de novo.
4. Se aparecer "Não achei: ...", são títulos que a busca não encontrou. Depois você adiciona pelo próprio site.

> Rode o seed **uma vez só**. Cada vez que roda, cria uma sala nova (e links novos).

## 7. Colocar o site no ar

1. Rode: `npm run deploy`
2. No final aparece o "Hosting URL" (algo como `https://nossa-sessao.web.app`). Esse comando também envia as regras do banco.

## 8. Qual link mandar para quem

- **Para ela**: o link **SEM** `dono`.
- **Para você (guarde só com você)**: o link **COM** `&dono=...`. Quem tem esse link tem poderes de dono, então não compartilhe.

Dica: abra o link dela no celular. Não deve aparecer tela de login.

## 9. Testar no seu computador

1. Rode: `npm run dev`
2. Abra o endereço que aparecer (normalmente http://localhost:5173) e adicione ao final o mesmo `?sala=...` do seu link.

---

## Deu problema?

**Aparece "Link incompleto"**
O link está cortado ou é o errado. Use o link inteiro que o `npm run seed` mostrou, começando em `https://` e com o `?sala=...`.

**Aparece "Não deu pra carregar"**
1. Veja se o login **Anônimo** está ativado (passo 2.1).
2. Veja se as regras foram enviadas: rode `npm run deploy` de novo.
3. Confira se os valores `VITE_FIREBASE_*` no `.env` estão certos e rode `npm run deploy` outra vez (o `.env` é lido na hora de montar o site).

**Os pôsteres não aparecem**
Confira o `VITE_TMDB_KEY` no `.env`. Tem que ser a "Chave da API" curta, não o token grande. Depois de corrigir, rode `npm run deploy` de novo.

**`npm run seed` diz "Defina VITE_... no arquivo .env"**
O `.env` não existe ou está com campo vazio. Volte ao passo 3.

**Nunca coloque suas chaves no README nem no GitHub.** Elas ficam só no `.env`.

## Publicar pelo GitHub (sem terminal)

O site também pode ser publicado automaticamente pelo GitHub Pages:

1. No repositório, **Settings → Secrets and variables → Actions → New repository secret**. Crie um segredo para cada linha do `.env.example` (`VITE_TMDB_KEY`, `VITE_FIREBASE_API_KEY`, etc.) com o valor correspondente.
2. **Settings → Pages → Source: GitHub Actions.**
3. Toda vez que algo entra na `master`, o GitHub testa, monta e publica o site em `https://<seu-usuario>.github.io/nossa-sessao/`.
4. Para criar a sala, abra `https://<seu-usuario>.github.io/nossa-sessao/?criar=1` e clique em **Criar sala**. Os dois links aparecem na tela — guarde o seu (com `dono`) só pra você.
