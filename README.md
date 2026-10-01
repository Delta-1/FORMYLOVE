# FORMYLOVE

Uma carta gótica para minha mulher, com rosas, contador, músicas, álbum e três enigmas que abrem um pedido de namoro.

Site: https://delta-1.github.io/FORMYLOVE/

## Personalizar

Edite `config.json` ou use `configurar.html` para preparar e baixar a configuração. Alterações nos bastidores ficam neste navegador até o arquivo ser publicado no repositório.

- `intro.him` e `intro.her`: caminhos das duas fotos da abertura (azul e rosa).
- `intro.song`: música da abertura, no formato `{ "type": "audio", "url": "assets/abertura.mp3", "title": "Nosso encontro", "artist": "Nós" }`.
- `photos`: fotos publicadas, com `url`, `feeling`, `category` (`ela`, `ele`, `nos`) e `date`.
- `playlists`: faixas YouTube ou áudio. Áudio próprio em `assets` permite player escondido; vídeos do YouTube mantêm player visível.
- `proposalSong`: música exclusiva da porta; substitui a trilha e o avanço aleatório é desativado durante o pedido.

O navegador pode exigir um toque para iniciar o som. A trilha toca em ordem aleatória e evita repetir imediatamente a mesma faixa quando há mais de uma. Volume salvo neste aparelho. Não há integração com Drive.

Fotos da câmera são guardadas em IndexedDB neste navegador e podem ser baixadas individualmente. Não são sincronizadas entre aparelhos. Limpar dados do navegador remove essas fotos. Fotos do `config.json` e `assets` fazem parte do site público.

## Rodar

`npm start` / `npm test`. A publicação no GitHub Pages acontece a cada atualização de main.
