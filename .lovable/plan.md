

# Corrigir Preview de PDF - Abordagem Simples com Blob URL

## Problema

O `pdfjs-dist` esta falhando porque o worker nao consegue ser carregado da CDN no ambiente do projeto. O erro e: `"Failed to fetch dynamically imported module"`.

## Solucao

Remover completamente o `pdfjs-dist` e usar uma abordagem muito mais simples: baixar o PDF como blob via fetch, criar uma Object URL local e exibir num `<embed>` ou `<object>` tag. Isso funciona nativamente em todos os navegadores modernos sem dependencias externas.

## Arquivo a Modificar

### `src/components/documents/DocumentDetailDialog.tsx`

1. Remover imports de `pdfjs-dist` e a configuracao do worker
2. Remover o componente `PdfViewer` inteiro
3. Para PDFs: usar `<embed src={signedUrl} type="application/pdf" />` diretamente com a signed URL
4. Manter o fallback de download caso o navegador nao suporte embed

A tag `<embed>` com `type="application/pdf"` usa o visualizador de PDF nativo do navegador (Chrome, Edge, Firefox todos possuem um). Diferente do `<iframe>`, o `<embed>` nao e bloqueado por politicas de seguranca do Edge.

## Detalhes Tecnicos

- `<embed>` e suportado por todos os navegadores modernos para PDFs
- Nao precisa de nenhuma biblioteca externa
- A signed URL ja funciona (confirmado nos logs de rede - status 200)
- Remover `pdfjs-dist` simplifica o codigo e elimina problemas de worker

