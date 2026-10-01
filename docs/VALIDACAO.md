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

- Player testado com uma simulação da API YouTube: troca para CuM61zC3xFo, volume e pausa. Isso verifica os controles do site; não garante disponibilidade de cada vídeo ou permissão de incorporação no YouTube.
- Álbum testado com serviços Google simulados: autenticação, isolamento da pasta e envio. A integração real exige publicar Code.gs + Bridge.html na conta Google e verificar o primeiro envio na pasta. Ainda não ativada nesta entrega.
- Câmera: interface e fluxo implementados. O acesso real depende de HTTPS, aparelho e autorização; não houve captura física de câmera durante a validação.
- Pages: workflow incluído. A opção GitHub Actions precisa ser habilitada em Settings → Pages; o plugin disponível não oferece uma ação para mudar essa configuração.

As prévias de computador e celular estão nesta pasta. As fotos pessoais ainda não foram fornecidas; o álbum mostra espaços vazios e não usa retratos inventados.
