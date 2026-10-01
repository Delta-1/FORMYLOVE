# Validação da primeira versão

## Automatizada — passou

- 7 testes Node: data e fuso horário; quatro músicas e faixa especial; configuração; sessões; leitura restrita à pasta; bytes de imagem; deduplicação; cursor assinado.
- Navegador Chromium: os três enigmas, tentativas erradas, itens e progresso após recarregar.
- A porta permanece fechada antes dos três itens e abre depois deles.
- Os botões Sim e Não funcionam e a resposta é preservada nesse navegador.
- Personalização nos Bastidores aparece na carta do mesmo aparelho.
- Layout nas larguras 320, 390, 768 e 1440 px; sem transbordamento significativo (tolerância de arredondamento de 1 px).
- Nenhum erro JavaScript de página nos fluxos testados.

## Limites da verificação

- Player testado com uma simulação da API YouTube: troca para CuM61zC3xFo, volume e pausa. No site publicado, o player real de Lonely Day carregou e o controle de volume mudou de 35% para 12%. A disponibilidade das demais faixas depende do YouTube.
- Álbum testado com serviços Google simulados: autenticação, isolamento da pasta e envio. A integração real exige publicar Code.gs + Bridge.html na conta Google e verificar o primeiro envio na pasta. Ainda não ativada nesta entrega.
- Câmera: interface e fluxo implementados. O acesso real depende de HTTPS, aparelho e autorização; não houve captura física de câmera durante a validação.
- Pages: publicação concluída com sucesso. A página, o config.json e a arte retornaram HTTP 200; a carta também foi verificada no navegador no endereço https://delta-1.github.io/FORMYLOVE/.

As prévias de computador e celular estão nesta pasta. As fotos pessoais ainda não foram fornecidas; o álbum mostra espaços vazios e não usa retratos inventados.
