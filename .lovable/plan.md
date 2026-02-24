

# Visualizacao de Documentos (Imagem e PDF)

## Problema Atual

O `DocumentDetailDialog` tenta exibir imagens usando uma URL direta com path "authenticated", que nao funciona sem headers de autorizacao. Alem disso, nao ha nenhum suporte para visualizacao de PDFs - apenas o botao de download.

## Solucao

Atualizar o `DocumentDetailDialog` para:

1. **Gerar uma URL assinada (signed URL)** via Supabase Storage para acessar o arquivo de forma segura
2. **Exibir imagens** usando a signed URL em uma tag `<img>`
3. **Exibir PDFs** usando a signed URL em um `<iframe>` com fallback para download
4. **Ampliar o dialog** para `max-w-3xl` quando houver preview, para melhor visualizacao

## Arquivo a Modificar

### `src/components/documents/DocumentDetailDialog.tsx`

- Adicionar `useState` e `useEffect` para gerar signed URL ao abrir o dialog
- Usar `supabase.storage.from("attachments").createSignedUrl(doc.file_path, 3600)` para obter URL temporaria (1h)
- Para imagens: renderizar `<img src={signedUrl} />` com loading state
- Para PDFs: renderizar `<iframe src={signedUrl} />` com altura fixa e borda arredondada
- Para outros tipos de arquivo: manter apenas o botao de download
- Aumentar o tamanho do dialog para acomodar o preview

## Detalhes Tecnicos

- **Signed URLs** expiram em 1 hora, suficiente para visualizacao
- O `useEffect` regenera a URL toda vez que o dialog abre com um documento diferente
- Estado de loading exibe um spinner enquanto a URL e gerada
- Tipos suportados para preview: `image/*` e `application/pdf`
- Nenhuma alteracao de banco de dados necessaria

