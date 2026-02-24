
Objetivo atualizado: resolver o preview de PDF com uma abordagem que não dependa do visualizador nativo do navegador (que pode falhar no Edge dentro de contexto embutido), mantendo a experiência simples e estável.

1) Diagnóstico consolidado (com base no que já está acontecendo)
- O download do arquivo funciona: as requisições do backend retornam 200 e conteúdo PDF válido.
- O componente já usa Blob URL local (`blob:`), então o problema principal não é permissão/URL.
- Mesmo assim, o `<embed>` ainda não renderiza no seu cenário atual.
- Conclusão prática: o bloqueio está na camada de renderização nativa do navegador (plugin/viewer), não no backend.
- Há também um warning de React persistente no mesmo diálogo (`Function components cannot be given refs`) que precisamos eliminar no mesmo ajuste.

2) Nova abordagem (mais confiável)
- Substituir preview de PDF via `<embed>` por renderização em `<canvas>` usando `pdfjs-dist` com worker local empacotado pelo Vite.
- Isso evita depender do viewer nativo do navegador e funciona em contexto embutido (onde `<embed>/<iframe>/<object>` pode falhar).
- Manter o fluxo atual de Blob URL para baixar o arquivo privado.
- Imagens continuam no `<img>` como já está.

3) Escopo de alteração
- `package.json` + lockfile: reintroduzir `pdfjs-dist`.
- `src/components/documents/DocumentDetailDialog.tsx`: trocar a parte de render de PDF.
- Novo componente para organização:
  - `src/components/documents/PdfCanvasPreview.tsx` (renderização do PDF em canvas com paginação simples).

4) Detalhes técnicos da implementação
- Carregamento do arquivo:
  - manter `storage.download(doc.file_path)`.
  - manter `URL.createObjectURL(blob)` com cleanup via `URL.revokeObjectURL`.
- Render do PDF:
  - no `PdfCanvasPreview`, buscar bytes a partir do Blob URL (`fetch(previewUrl)` + `arrayBuffer`).
  - usar `pdfjs-dist` para abrir documento e renderizar página no `canvas`.
  - configurar worker local (sem CDN), para evitar o erro antigo de “Failed to fetch dynamically imported module”.
- UX mínima:
  - mostrar spinner ao renderizar página.
  - botões “Anterior / Próxima” quando houver múltiplas páginas.
  - fallback claro: se falhar renderização, mostrar mensagem e manter botão de download.
- Warning de ref:
  - simplificar estrutura do header do diálogo para não usar composição que possa receber `ref` indevido.
  - manter `DialogDescription` válido para acessibilidade (elimina warning de descrição ausente).

5) Sequência de execução (ordem segura)
- Passo A: reintroduzir dependência `pdfjs-dist`.
- Passo B: criar `PdfCanvasPreview` isolado e testável.
- Passo C: integrar no `DocumentDetailDialog` apenas para `application/pdf`.
- Passo D: manter fluxo atual para imagens e download.
- Passo E: ajustar header/description para eliminar warnings de console.

6) Critérios de aceite
- PDF abre no modal em Edge no seu ambiente atual.
- Imagens seguem abrindo normalmente.
- Download continua funcionando para qualquer tipo de arquivo.
- Trocar entre documentos não reaproveita preview antigo.
- Console sem warning de `Function components cannot be given refs` nesse diálogo.
- Sem vazamento de memória (Blob URLs revogadas corretamente).

7) Validação manual fim a fim
- Em `/documents`:
  - abrir PDF de 1 página e confirmar render.
  - abrir PDF de múltiplas páginas e navegar entre páginas.
  - abrir PNG/JPG e validar preview.
  - fechar/reabrir documentos em sequência para validar cleanup.
  - testar no Edge e Chrome.
  - simular erro (arquivo indisponível) e confirmar fallback + download.

8) Riscos e mitigação
- Risco: PDF grande ficar lento na primeira renderização.
  - Mitigação: spinner e renderização por página.
- Risco: configuração do worker quebrar em build.
  - Mitigação: usar worker local via import do bundle (sem CDN) e fallback amigável para erro.
- Risco: regressão visual no modal.
  - Mitigação: manter dimensões atuais e alterar apenas o bloco de preview do PDF.
