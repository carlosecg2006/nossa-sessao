# Nossa Sessão: catálogo de filmes para escolher juntos (site próprio)

## Para que serve
O Carlos e uma amiga assistem filmes juntos pelo Kosmi. O Carlos compartilha a tela. Eles já viram Magia e Sedução 1 e 2, e agora ele não sabe o que ela gosta. O site é um catálogo no estilo da Netflix: ela explora sozinha, sente o clima de cada filme e mostra o gosto dela. Os dois montam a fila e vão marcando o que já assistiram.

**Dá certo quando:** ela abre o link sem cadastro nenhum, explora, escolhe, e o Carlos vê a escolha na hora.

**Não pode acontecer:** pedir conta ou login para ela; spoilers; parecer uma lista sem graça.

## Pessoas
- **Ela:** entra pelo link secreto da sala. Explora, marca "Quero ver" ou "Não curti", adiciona filmes, organiza a fila e marca como assistido.
- **Carlos:** entra pelo mesmo link mais uma chave de dono. Faz tudo que ela faz e também recebe o aviso das escolhas, vê a área "Pra revisar" (os "Não curti") e remove filmes do catálogo.

## Tecnologia (escolha do Carlos: caminho B)
- **React**, com Vite, para o site.
- **Firebase:** o Firestore guarda os dados e atualiza em tempo real, e o Hosting deixa o site no ar. Tudo com uma conta Google, de graça.
- **Login anônimo do Firebase:** acontece por baixo dos panos e ela não vê nem preenche nada. Isso permite proteger o banco: só quem tem o código da sala lê e escreve.
- **TMDB** (API grátis) para busca, sinopse em português, elenco, duração, classificação, pôsteres, fotos, trailer do YouTube e onde assistir no Brasil (só serviços legais).

## Visual
- A mesma estrutura e o mesmo jeito de usar da Netflix, sem logo nem nome dela. O vermelho vira roxo (#8B3DFF) sobre preto (#0B0710).
- **Topo:** um filme em destaque, com o fundo da cena do filme, título, sinopse curta e os botões ▶ Trailer, ♥ Quero ver e + Fila.
- **Fileiras horizontais de pôsteres:** Nossa fila, Escolhidos por ela, os filmes do catálogo separados por gênero (Bruxas e magia, Romance, Comédia...), Lançamentos (puxados ao vivo do TMDB) e Já vimos ✓.
- **Janela de detalhes:** pôster, fotos, trailer tocando ali mesmo, ano, duração, classificação, gêneros, direção, elenco, sinopse e onde assistir. Botões ♥ Quero ver, 👎 Não curti e + Fila.
- **Busca no topo:** digitou, aparecem sugestões do TMDB. Um toque adiciona o filme ao catálogo.
- Funciona no celular e no PC.

## Como os filmes chegam
- **Catálogo escolhido por eles:** começa com os 16 títulos da lista (a trilogia Antes entra como 3 filmes) e com Magia e Sedução 1 e 2 em "Já vimos". Cresce pela busca.
- **Lançamentos:** fileira ao vivo do TMDB (em cartaz e em breve no Brasil). Daqui, um toque adiciona ao catálogo.
- No Firestore ficam só o ID do TMDB e o estado de cada filme. Os detalhes vêm sempre frescos do TMDB.

## Escolha, fila e assistidos
- **"Quero ver":** o filme entra em "Escolhidos por ela" e o Carlos recebe um aviso na hora: "Ela escolheu: X".
- **"Não curti":** o filme vai para "Pra revisar", que só o Carlos vê, com o botão Remover.
- **Fila:** os dois adicionam filmes. A ordem muda arrastando no PC ou com setas no celular.
- **Assistido:** o filme sai da fila e vai para "Já vimos", com a data.

## Fora do escopo
- Tocar os filmes no site (eles assistem pelo Kosmi).
- Links para sites de streaming não oficiais.
- Contas, senhas e perfis.

## O que o Carlos faz (eu guio passo a passo)
1. Criar a conta no TMDB e pegar a chave da API.
2. Criar o projeto no Firebase com a conta Google.
3. Rodar os comandos de publicação que eu passar.

## Decisões que deixo para quem constrói (minhas escolhas)
- Nome "Nossa Sessão". Fontes Bebas Neue (títulos) e Inter (texto).
- A chave do TMDB fica no próprio site. Para um projeto pessoal isso é aceitável, porque a chave só lê dados públicos.
- A segurança vem do código da sala, que é difícil de adivinhar, mais o login anônimo e as regras do Firestore. A chave de dono é um segundo código, só no link do Carlos.
- Código em TypeScript, guardado num repositório do GitHub do Carlos.
