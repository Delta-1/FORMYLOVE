# FORMYLOVE 🥀

Uma carta gótica para minha mulher, feita por Victor H. Souza. Preto e vinho, moldura de rosas original, detalhes prateados, brilho discreto e enigmas em roxo. Interface em português e responsiva para celular.

![Prévia de computador](docs/preview-desktop.png)

## Já incluído

- Carta editável e as frases de química, biologia, matemática, geografia e história.
- Contador desde **25/08/2026, 00h, horário de São Paulo**.
- Quatro músicas do YouTube com fila, pausa, próxima/anterior e volume (inicial 35%).
- Música **CuM61zC3xFo** acionada pelo clique que abre a porta.
- Álbum com filtros Ela / Ele / Nós; câmera, escolha de imagem, data e legenda sentimental.
- Três desafios: roxo → rosa; programador + São Paulo → estrela; Re:Zero antes de Bleach → chave. A porta só abre com os três.
- Pedido “Quer namorar comigo? Vamos oficializar?”, figurinha original e opções Sim / Não. A resposta é respeitada, sem botão que foge.
- Progresso, resposta e volume preservados **neste navegador**. A resposta não é enviada a Victor; ela pode mostrar pessoalmente.
- Bastidores para personalizar localmente e baixar/importar `config.json`.
- Animações suaves com alternativa para quem usa redução de movimento.

## Publicar no GitHub Pages

Em **Settings → Pages → Build and deployment → Source**, selecione **GitHub Actions**. O workflow `Publicar a nossa carta` publica os arquivos da pasta `public-site` preparada durante a execução. Se Pages já estiver habilitado, basta o commit. Se a implantação falhar por Pages não estar habilitado, ative essa opção e execute o workflow novamente em Actions.

O site é estático, sem dependências de produção. Os caminhos são relativos, compatíveis com `/FORMYLOVE/`. O domínio de Pages deve ser confirmado pela implantação, não apenas deduzido do nome do repositório.

## Fotos privadas no Google Drive — ativação única necessária

Pasta criada: **FORMYLOVE — Nosso álbum**. Abra-a no seu Drive ou pelo link entregue na conversa. Seu identificador deve ficar somente nas propriedades do Apps Script, fora dos arquivos públicos.

O plugin do Drive cria a pasta, mas não publica aplicativos do Google Apps Script. Por isso, o código está pronto e a publicação precisa ser feita na conta Google que tem acesso à pasta. **Até essa ativação, o site mostra explicitamente que o álbum está desconectado e não promete salvar fotos.**

1. Abra <https://script.google.com/home/start> na mesma conta da pasta.
2. Cole `drive/Code.gs` no arquivo Code.gs.
3. Crie um arquivo HTML chamado **Bridge** e cole `drive/Bridge.html`.
4. Nas Configurações do projeto → Propriedades do script, defina:
   - `ALBUM_FOLDER_ID`: ID da pasta privada, encontrado na parte final do link da pasta no Drive.
   - `ALBUM_PASSWORD`: frase secreta de pelo menos 12 caracteres. Não publique essa frase no repositório nem em config.json.
   - `ALLOWED_ORIGINS`: origem exata do site, normalmente `https://delta-1.github.io`, sem `/FORMYLOVE` nem barra final. Para testes, pode adicionar `http://localhost:4173`, separado por vírgula.
5. Execute **setupAlbum_** pelo editor e autorize o Drive. Ela testa a pasta, transforma a senha em hash com salt e remove a senha em texto das propriedades. Para trocar a senha, defina ALBUM_PASSWORD novamente e execute setupAlbum_ outra vez: as sessões anteriores deixam de valer.
6. Implantar → Nova implantação → Aplicativo da Web. **Executar como: Eu**, **Quem pode acessar: Qualquer pessoa**. A API continua protegida por senha e sessão assinada; a pasta e suas fotos não são tornadas públicas.
7. Copie o link **/exec** para `drive.endpoint` em `config.json` (ou nos Bastidores, seguido de baixar e atualizar o arquivo no GitHub).
8. No site, abra Álbum → Atualizar e informe a frase. Fotografe, escreva o sentimento e guarde. Confirme a presença do arquivo na pasta.

O transporte usa uma ponte HtmlService com `google.script.run` e mensagens com origem e canal verificados, sem JSONP e sem expor credenciais OAuth. Sessões duram 8 horas e ficam na memória da página. Fotos só podem ser lidas da pasta específica. Login tem limite de tentativas. Envios incluem identificador para evitar duplicatas se a conexão falhar.

Fotos adicionadas diretamente à pasta aparecem com **Atualizar**, ao entrar no álbum ou ao retornar à aba do navegador. A data padrão é a data de criação e a categoria padrão é Nós. A descrição no Drive aparece como legenda. A lista tem paginação. JPEG, PNG e WEBP são aceitos; fotos muito grandes sem thumbnail exigem uma versão menor. O site redimensiona fotos enviadas por ele para até 1600px e remove os metadados originais pelo canvas. As imagens privadas não são gravadas em localStorage nem em cache offline.

## Personalizar

Abra `configurar.html` ou o link Bastidores no rodapé. Salvar aplica as alterações somente naquele aparelho. **Baixar config.json** permite publicar a mesma versão para os dois no GitHub.

O `config.json` controla nome/apelido, assinatura, data, parágrafos, frases, respostas dos três desafios, animes, músicas, fotos estáticas e endpoint. O arquivo não deve conter segredos. Novos tipos de minigames podem ser desenvolvidos sobre `initQuests()` em `app.js`.

Para fotos pessoais, use a pasta privada do Drive. Os arquivos do repositório atual são públicos: fotos em `assets/` e informações escritas na carta podem ser acessadas por quem conhece o site/repositório. A porta é uma surpresa narrativa; o quiz não é controle de segurança.

## Músicas e câmera

A música começa após interação da visitante; navegadores podem bloquear autoplay e vídeos podem restringir incorporação. O player YouTube fica visível enquanto toca, com link alternativo para abrir no YouTube. Fechar o player pausa o som. Ao abrir a porta, a música especial substitui a faixa atual. O volume escolhido permanece.

Câmera precisa de HTTPS ou localhost e permissão. “Escolher foto” também permite usar a câmera do celular. Sem autorização ou sem câmera, continua disponível escolher uma foto existente.

## Desenvolvimento

```sh
npm start
# http://localhost:4173
npm test
```

Não precisa instalar pacotes para executar. Os testes cobrem contador, validação de configuração, bloqueio de leitura fora da pasta, sessão e deduplicação do envio. A integração real com Google precisa da publicação acima; testes locais não substituem essa validação.

A arte original das rosas foi criada com geração de imagens a partir do conceito: “rosas carmim, gravura vitoriana, arco de catedral gótica prateado, lua, papel preto texturizado, sem texto”. Asset final: `assets/gothic-rose.webp`. A figurinha de `assets/pedido.png` foi fornecida pelo Victor. As duas referências visuais orientaram a direção; não foram copiadas como interface.

Fontes incluídas localmente, com licenças OFL em `assets/fonts/`. Confira [a validação e seus limites](docs/VALIDACAO.md).
