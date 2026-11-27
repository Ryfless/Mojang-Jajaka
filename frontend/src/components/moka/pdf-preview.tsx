import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import type { PDFDocumentLoadingTask, PDFDocumentProxy, RenderTask } from 'pdfjs-dist'
import { Alert, Button, Text } from './ui'

function PDFCanvas({
  url,
  name,
  fullscreen = false,
  zoom = 1,
}: {
  url: string
  name?: string | null
  fullscreen?: boolean
  zoom?: number
}) {
  const container = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [pdf, setPDF] = useState<PDFDocumentProxy | null>(null)
  const [page, setPage] = useState(1)
  const [width, setWidth] = useState(0)
  const [renderedKey, setRenderedKey] = useState('')
  const [error, setError] = useState('')
  const [pageText, setPageText] = useState('')

  const baseWidth = fullscreen ? Math.min(width, 980) : width
  const displayWidth = Math.max(200, Math.floor(baseWidth * zoom))
  const currentRenderKey = `${page}:${width}:${zoom}`
  const rendering = !error && (!pdf || !width || renderedKey !== currentRenderKey)

  useEffect(() => {
    if (!container.current) return
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)))
    observer.observe(container.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    let active = true
    let task: PDFDocumentLoadingTask | undefined
    import('pdfjs-dist')
      .then(async ({ getDocument, GlobalWorkerOptions }) => {
        if (!active) return
        GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
        task = getDocument({ url, useSystemFonts: true })
        const document = await task.promise
        if (active) setPDF(document)
      })
      .catch(() => {
        if (active) {
          setError('Pratinjau PDF belum dapat dirender. Coba lagi atau unduh berkas.')
        }
      })
    return () => {
      active = false
      void task?.destroy()
    }
  }, [url])

  useEffect(() => {
    if (!pdf || !canvas.current || !width) return
    let active = true
    let task: RenderTask | undefined
    pdf
      .getPage(page)
      .then(async (documentPage) => {
        if (!active || !canvas.current) return
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
        const scale = (displayWidth * pixelRatio) / documentPage.getViewport({ scale: 1 }).width
        const viewport = documentPage.getViewport({ scale })
        canvas.current.width = Math.ceil(viewport.width)
        canvas.current.height = Math.ceil(viewport.height)
        task = documentPage.render({ canvas: canvas.current, viewport })
        await task.promise
        if (!active) return
        setRenderedKey(`${page}:${width}:${zoom}`)
        const content = await documentPage.getTextContent()
        if (active)
          setPageText(
            content.items
              .map((item) => ('str' in item ? item.str : ''))
              .join(' ')
              .slice(0, 20000),
          )
      })
      .catch((e) => {
        if (active && e.name !== 'RenderingCancelledException') {
          setError('Halaman PDF belum dapat ditampilkan. Coba lagi atau unduh berkas.')
        }
      })
    return () => {
      active = false
      task?.cancel()
    }
  }, [pdf, page, width, zoom, displayWidth])

  return (
    <div className={fullscreen ? 'flex h-full min-h-0 flex-col' : undefined}>
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
        <Text className={`text-xs ${fullscreen ? 'text-champagne/85' : 'text-muted'}`}>
          {pdf ? `Halaman ${page} dari ${pdf.numPages}` : 'Memuat PDF…'}
        </Text>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            className={`!size-8 !min-h-8 !p-0 ${fullscreen ? '!border-champagne/25 !bg-paper/10 !text-ivory hover:!bg-paper/20' : ''}`}
            aria-label="Halaman PDF sebelumnya"
            disabled={!pdf || page <= 1 || rendering}
            onClick={() => setPage(page - 1)}
          >
            <ChevronLeft size={16} />
          </Button>
          <Button
            variant="secondary"
            className={`!size-8 !min-h-8 !p-0 ${fullscreen ? '!border-champagne/25 !bg-paper/10 !text-ivory hover:!bg-paper/20' : ''}`}
            aria-label="Halaman PDF berikutnya"
            disabled={!pdf || page >= pdf.numPages || rendering}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      </div>
      {error && (
        <Alert tone="error" className="mb-3 shrink-0">
          {error}
        </Alert>
      )}
      <div
        ref={container}
        className={
          fullscreen
            ? 'relative min-h-0 flex-1 overflow-auto rounded-lg border border-champagne/15 bg-black/25 p-4 sm:p-6'
            : 'relative max-h-[62dvh] overflow-auto rounded-lg border border-line bg-canvas p-4'
        }
      >
        {rendering && (
          <div
            role="status"
            className={`flex items-center justify-center gap-3 text-xs ${
              fullscreen
                ? `text-champagne ${pdf ? 'absolute inset-0 z-10 bg-cocoa/75' : 'min-h-40'}`
                : `text-muted ${pdf ? 'absolute inset-0 z-10 bg-paper/80' : 'min-h-40'}`
            }`}
          >
            <Loader2 size={19} className="animate-spin" />
            Merender halaman PDF…
          </div>
        )}
        <canvas
          ref={canvas}
          role="img"
          aria-label={`Halaman ${page}: ${name || 'Dokumen PDF'}`}
          data-rendered={!!pdf && !rendering && !error}
          style={{ width: `${displayWidth}px` }}
          className={`mx-auto h-auto bg-white shadow-sm ${!pdf || error ? 'hidden' : 'block'}`}
        />
        <Text as="span" className="sr-only">
          {pageText}
        </Text>
      </div>
    </div>
  )
}

export default function PDFPreview({
  url,
  name,
  fullscreen = false,
  zoom = 1,
}: {
  url: string
  name?: string | null
  fullscreen?: boolean
  zoom?: number
}) {
  return <PDFCanvas key={url} url={url} name={name} fullscreen={fullscreen} zoom={zoom} />
}
