
Objetivo: fazer o preview de PDF funcionar de forma confiável no Edge (e demais navegadores) com uma abordagem simples, removendo dependência do comportamento de incorporação cross-origin.

1) Diagnóstico do problema atual
- Hoje o componente usa `<embed src={signedUrl}>` com URL assinada remota.
- Em alguns cenários (especialmente Edge + contexto embutido), o navegador bloqueia renderização de PDF cross-origin mesmo com URL válida.
- Os logs e requests mostram que a assinatura do arquivo funciona (status 200), então o gargalo é renderização no navegador, não permissão de backend.
- Há também 2 avisos de UI no mesmo diálogo:
  - `Function components cannot be given refs` envolvendo `Badge`.
  - `Missing Description or aria-describedby` no `DialogContent`.

2) Estratégia simples e eficaz (robusta)
- Substituir preview remoto por preview local via Blob URL:
  - Baixar o arquivo com `storage.download(doc.file_path)` (requisição autenticada já existente no app).
  - Criar URL local com `URL.createObjectURL(blob)`.
  - Renderizar:
    - imagem: `<img src={objectUrl}>`
    - PDF: `<embed src={objectUrl} type="application/pdf">` (ou `<object>` fallback)
- Benefício: o PDF passa a ser servido como `blob:` local do app, evitando bloqueios de incorporação cross-origin no Edge.

3) Arquivo a ajustar
- `src/components/documents/DocumentDetailDialog.tsx`

4) Mudanças planejadas no componente
- Estado:
  - trocar `signedUrl` por `previewUrl` (blob URL local).
  - manter `loading`.
  - opcional: `previewError` para exibir mensagem clara quando falhar.
- Efeito (`useEffect`):
  - quando abrir e for arquivo previewável (imagem/pdf), chamar `supabase.storage.from("attachments").download(doc.file_path)`.
  - gerar `objectUrl` via `URL.createObjectURL(data)`.
  - salvar em estado e limpar loading.
  - em erro: limpar preview e manter botão de download.
- Limpeza obrigatória:
  - revogar URL antiga com `URL.revokeObjectURL(...)` ao trocar documento/fechar diálogo/desmontar componente.
- Renderização:
  - imagem: usar `previewUrl`.
  - PDF: usar `previewUrl` no `<embed>`.
  - sem preview disponível: mostrar texto de fallback + botão de download.
- Acessibilidade:
  - adicionar `DialogDescription` (ou `aria-describedby={undefined}` se preferirem eliminar aviso rapidamente; ideal é descrição real).
- Aviso do `Badge`:
  - ajustar header para evitar composição que dispara warning de ref (ex.: deixar `DialogTitle` só com texto e mover badge para bloco separado no `DialogHeader`).

5) Critérios de aceite
- PDF abre no modal no Edge sem mensagem de bloqueio.
- Imagens continuam abrindo normalmente.
- Botão de download continua funcionando para todos os tipos.
- Sem vazamento de memória (object URL revogada corretamente).
- Console sem os dois warnings atuais do diálogo.

6) Plano de validação (manual end-to-end)
- Na rota `/documents`:
  - abrir documento PDF e confirmar preview no modal;
  - abrir documento PNG/JPG e confirmar preview;
  - fechar/reabrir vários documentos em sequência (garantir que não “mistura” preview anterior);
  - testar no Edge e Chrome;
  - testar fallback: forçar erro (arquivo removido) e confirmar que pelo menos o download/falha amigável aparece.

7) Risco e mitigação
- Risco: PDFs muito grandes podem demorar mais para carregar.
- Mitigação: manter spinner durante download + mensagem “carregando documento”.
- Risco: object URL não revogada.
- Mitigação: cleanup explícito no `useEffect` e ao fechar diálogo.
