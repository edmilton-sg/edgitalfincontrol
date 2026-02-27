import { useEffect, useRef, useState } from "react";
import * as pdfjsLib from "pdfjs-dist";
import workerSrc from "pdfjs-dist/build/pdf.worker.mjs?url";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

// Configure worker using Vite's ?url import (bundled locally, no CDN)
pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

interface PdfCanvasPreviewProps {
  url: string;
}

export function PdfCanvasPreview({ url }: PdfCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);

  // Load the PDF document once
  useEffect(() => {
    let cancelled = false;

    async function loadPdf() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(url);
        const arrayBuffer = await response.arrayBuffer();

        let pdf: pdfjsLib.PDFDocumentProxy;
        try {
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        } catch (workerError) {
          console.warn("PDF worker falhou, tentando fallback sem worker", workerError);
          pdf = await pdfjsLib.getDocument({ data: arrayBuffer, disableWorker: true } as any).promise;
        }

        if (cancelled) {
          pdf.destroy();
          return;
        }

        pdfDocRef.current = pdf;
        setNumPages(pdf.numPages);
        setCurrentPage(1);
      } catch (err) {
        console.error("Erro ao carregar PDF no preview:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPdf();

    return () => {
      cancelled = true;
      pdfDocRef.current?.destroy();
      pdfDocRef.current = null;
    };
  }, [url]);

  // Render the current page
  useEffect(() => {
    if (!pdfDocRef.current || !canvasRef.current || loading || error) return;
    let cancelled = false;

    async function renderPage() {
      try {
        const pdf = pdfDocRef.current!;
        const page = await pdf.getPage(currentPage);
        if (cancelled) return;

        const canvas = canvasRef.current!;
        const containerWidth = canvas.parentElement?.clientWidth ?? 700;
        const unscaledViewport = page.getViewport({ scale: 1 });
        const scale = containerWidth / unscaledViewport.width;
        const viewport = page.getViewport({ scale });

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err) {
        console.error("Erro ao renderizar página do PDF:", err);
        if (!cancelled) setError(true);
      }
    }

    renderPage();

    return () => {
      cancelled = true;
    };
  }, [currentPage, loading, error]);

  if (error) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Não foi possível renderizar o PDF. Use o botão abaixo para baixar.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="w-full rounded-md" />
          {numPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPage} / {numPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= numPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
