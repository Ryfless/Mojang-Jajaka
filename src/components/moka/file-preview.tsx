import { useEffect, useRef, useState } from 'react'
import {
  Download,
  FileText,
  Loader2,
  Maximize2,
  Minimize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import { resolveDocumentUrl } from '@/services/moka-mock-service'
import type { MokaDocument } from '@/types/moka'
import { Alert, AppLink, Button, Modal, Panel, Text } from './ui'
import PDFPreview from './pdf-preview'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 2.5
const ZOOM_STEP = 0.25

function TextDocumentPreview({ url, fullscreen = false }: { url: string; fullscreen?: boolean }) {
  const [state, setState] = useState<{ url: string; text: string; error: string }>({
    url: '',
    text: '',
    error: '',
  })

  useEffect(() => {
    const controller = new AbortController()
    fetch(url, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error('Berkas teks belum dapat dimuat.')
        const content = (await response.text()).slice(0, 20000)
        setState({ url, text: content, error: '' })
      })
      .catch((e) => {
        if (e.name !== 'AbortError') {
          setState({ url, text: '', error: (e as Error).message })
        }
      })
    return () => controller.abort()
  }, [url])

  if (state.url !== url) {
    return (
      <div
        className={`flex h-48 items-center justify-center gap-3 text-sm ${fullscreen ? 'text-champagne' : 'text-muted'}`}
      >
        <Loader2 size={20} className="animate-spin" />
        Memuat pratinjau…
      </div>
    )
  }
  if (state.error) return <Alert tone="error">{state.error}</Alert>
  return (
    <pre
      className={
        fullscreen
          ? 'h-full overflow-auto whitespace-pre-wrap break-words rounded-lg bg-paper p-6 font-sans text-sm leading-7 text-ink'
          : 'max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-canvas p-5 font-sans text-sm leading-7'
      }
    >
      {state.text}
    </pre>
  )
}

function FilePreviewContent({
  document,
  onClose,
  inline = false,
}: {
  document?: MokaDocument
  onClose: () => void
  inline?: boolean
}) {
  const [fullscreen, setFullscreen] = useState(false)
  const [zoom, setZoom] = useState(1)
  const fsRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = fsRef.current
    if (fullscreen && !dialog?.open) dialog?.showModal()
    if (!fullscreen && dialog?.open) dialog.close()
  }, [fullscreen])

  const url = resolveDocumentUrl(document)
  const image = Boolean(
    document?.mimeType &&
    ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'].includes(
      document.mimeType,
    ),
  )
  const isPdf = document?.mimeType === 'application/pdf'
  const name = document?.originalName || document?.filename

  const openFullscreen = () => {
    setZoom(1)
    setFullscreen(true)
  }

  const closeFullscreen = () => {
    setFullscreen(false)
    setZoom(1)
  }

  const zoomOut = () => setZoom((z) => Math.max(MIN_ZOOM, Number((z - ZOOM_STEP).toFixed(2))))
  const zoomIn = () => setZoom((z) => Math.min(MAX_ZOOM, Number((z + ZOOM_STEP).toFixed(2))))
  const resetZoom = () => setZoom(1)

  const fullscreenButton = document ? (
    <Button
      variant="secondary"
      className="!min-h-8 !gap-1.5 !px-3 !py-1.5 !text-xs"
      onClick={openFullscreen}
    >
      <Maximize2 size={14} />
      Fullscreen
    </Button>
  ) : null

  const fullscreenDialog = (
    <dialog
      ref={fsRef}
      aria-label={`Tinjauan layar penuh: ${name || 'Dokumen'}`}
      onCancel={(event) => {
        event.preventDefault()
        closeFullscreen()
      }}
      className="m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-cocoa/95 p-0 text-ivory backdrop:bg-cocoa/90"
    >
      <div className="flex h-full flex-col">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-champagne/15 bg-cocoa px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <FileText size={19} className="shrink-0 text-gold-light" />
            <div className="min-w-0">
              <Text className="truncate text-sm font-medium text-ivory">{name || 'Dokumen'}</Text>
              <Text className="text-[11px] text-champagne/75">
                {document?.filesize ? `${(document.filesize / 1024).toFixed(1)} KB` : 'Dokumen'} ·
                Tinjauan layar penuh
              </Text>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {url && (image || isPdf) && (
              <div className="flex items-center gap-1 rounded-lg border border-champagne/20 bg-umber/60 p-1">
                <Button
                  variant="ghost"
                  aria-label="Perkecil"
                  disabled={zoom <= MIN_ZOOM}
                  onClick={zoomOut}
                  className="!size-8 !min-h-8 !p-0 !text-ivory hover:!bg-champagne/15"
                >
                  <ZoomOut size={15} />
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Reset zoom ke 100%"
                  onClick={resetZoom}
                  className="!min-h-8 !gap-1 !px-2.5 !py-1 !text-xs !font-medium !text-ivory hover:!bg-champagne/15"
                >
                  <RotateCcw size={12} />
                  {Math.round(zoom * 100)}%
                </Button>
                <Button
                  variant="ghost"
                  aria-label="Perbesar"
                  disabled={zoom >= MAX_ZOOM}
                  onClick={zoomIn}
                  className="!size-8 !min-h-8 !p-0 !text-ivory hover:!bg-champagne/15"
                >
                  <ZoomIn size={15} />
                </Button>
              </div>
            )}
            {url && (
              <AppLink
                href={url}
                download={name || 'dokumen'}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-champagne/25 bg-umber/70 px-3 py-1.5 text-xs font-medium text-ivory hover:bg-champagne/15"
              >
                <Download size={14} />
                <span className="hidden sm:inline">Unduh</span>
              </AppLink>
            )}
            <Button
              variant="ghost"
              onClick={closeFullscreen}
              className="!min-h-9 !gap-1.5 !border !border-champagne/25 !bg-brand !px-3.5 !py-1.5 !text-xs !text-ivory hover:!bg-brand-dark"
            >
              <Minimize2 size={14} />
              Keluar fullscreen
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-4 sm:p-6">
          {!url ? (
            <Alert tone="error">
              Pratinjau belum dapat dimuat untuk berkas ini. Unggah ulang berkas jika diperlukan.
            </Alert>
          ) : image ? (
            <div className="flex min-h-full min-w-full items-center justify-center">
              <img
                src={url}
                alt={`Pratinjau layar penuh ${name || 'dokumen'}`}
                style={zoom === 1 ? undefined : { height: `${Math.round(zoom * 82)}dvh` }}
                className={
                  zoom === 1
                    ? 'max-h-[calc(100dvh-7rem)] max-w-full rounded object-contain'
                    : 'w-auto max-w-none rounded object-contain'
                }
              />
            </div>
          ) : isPdf ? (
            <PDFPreview url={url} name={name} fullscreen zoom={zoom} />
          ) : document?.mimeType === 'text/plain' ? (
            <TextDocumentPreview url={url} fullscreen />
          ) : (
            <Alert className="!bg-paper !text-xs !text-ink">
              Format ini tidak mendukung pratinjau langsung. Unduh berkas untuk memeriksa isinya.
            </Alert>
          )}
        </div>
      </div>
    </dialog>
  )

  const content = (
    <>
      <div className="mb-5 flex items-start gap-3">
        <FileText size={21} className="shrink-0 text-brand" />
        <div className="min-w-0">
          <Text className="break-all text-sm font-medium">{name}</Text>
          <Text className="mt-1 text-xs text-muted">
            {document?.filesize ? `${(document.filesize / 1024).toFixed(1)} KB` : ''} · Dokumen
            simulasi lokal
          </Text>
        </div>
      </div>
      {!url ? (
        <Alert tone="error">
          Pratinjau belum dapat dimuat untuk berkas ini. Unggah ulang berkas jika diperlukan.
        </Alert>
      ) : image ? (
        <div className="flex h-96 items-center justify-center overflow-hidden rounded-lg bg-canvas p-2">
          <img
            src={url}
            alt={`Pratinjau ${name || 'dokumen'}`}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      ) : isPdf ? (
        <PDFPreview url={url} name={name} />
      ) : document?.mimeType === 'text/plain' ? (
        <TextDocumentPreview url={url} />
      ) : (
        <Alert className="!text-xs">
          Format ini tidak mendukung pratinjau langsung. Unduh berkas untuk memeriksa isinya.
        </Alert>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <Text className="max-w-sm text-[10px] leading-6 text-muted">
          Tinjau isi dan keterbacaan dokumen di laman ini. Unduh berkas hanya jika diperlukan.
        </Text>
        {url && (
          <AppLink
            href={url}
            download={name || 'dokumen'}
            className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-3 text-xs font-medium text-ivory hover:bg-brand-dark"
          >
            <Download size={15} />
            Unduh berkas
          </AppLink>
        )}
      </div>
    </>
  )

  if (inline)
    return document ? (
      <>
        <Panel className="!border-brand/25">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <Text as="h2" className="font-serif text-xl">
              Tinjauan dokumen
            </Text>
            <div className="flex items-center gap-2">
              {fullscreenButton}
              <Button variant="ghost" className="!min-h-8 !p-1 !text-xs" onClick={onClose}>
                Tutup tinjauan
              </Button>
            </div>
          </div>
          {content}
        </Panel>
        {fullscreenDialog}
      </>
    ) : null

  return (
    <>
      <Modal
        open={!!document}
        onClose={onClose}
        title="Pratinjau dokumen"
        wide
        headerActions={fullscreenButton}
      >
        {content}
      </Modal>
      {fullscreenDialog}
    </>
  )
}

export default function FilePreview({
  document,
  onClose,
  inline = false,
}: {
  document?: MokaDocument
  onClose: () => void
  inline?: boolean
}) {
  if (inline && !document) return null
  return (
    <FilePreviewContent
      key={document?.id || 'empty'}
      document={document}
      onClose={onClose}
      inline={inline}
    />
  )
}
