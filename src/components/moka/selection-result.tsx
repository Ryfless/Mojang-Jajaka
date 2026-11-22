import { useEffect, useState } from 'react'
import { CalendarDays, Eye, LockKeyhole, MapPin, ShieldCheck } from 'lucide-react'
import { selectionIsOpen } from '@/lib/moka-policy'
import { mokaApi } from '@/services/moka-mock-service'
import type { Interview } from '@/types/moka'
import { Alert, Badge, Button, Modal, Panel, Text } from './ui'
import { dateLabel, type WorkspaceData } from './types'
import { useServerClock } from './use-server-clock'

type Result = {
  winner: boolean
  name: string
  category: string
  releasedAt: string
  interviews?: Interview[]
}

export default function SelectionResult({ data }: { data: WorkspaceData }) {
  const now = useServerClock(data.serverTime)
  const ready = selectionIsOpen(data.settings, now)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [result, setResult] = useState<Result | null>(null)
  const [error, setError] = useState('')
  const [opened, setOpened] = useState(false)

  useEffect(() => {
    if (countdown === null) return
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
    let active = true
    mokaApi('selection-result', undefined, 'participant')
      .then((value) => {
        if (active) setResult(value as Result)
      })
      .catch((e) => {
        if (active) setError((e as Error).message || 'Hasil belum dapat dimuat.')
      })
    return () => {
      active = false
    }
  }, [countdown])

  const close = () => {
    setOpened(false)
    setCountdown(null)
    setResult(null)
    setError('')
  }

  return (
    <>
      <Panel className="mb-7 !border-gold/30">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-brand">
              {ready ? <Eye size={22} /> : <LockKeyhole size={21} />}
            </span>
            <div>
              <Text className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand">
                Hasil seleksi MOKA
              </Text>
              <Text as="h2" className="font-serif text-2xl">
                {ready ? 'Saatnya membuka hasil seleksimu.' : 'Perjalananmu masih berlanjut.'}
              </Text>
              <Text className="mt-2 text-xs leading-6 text-muted">
                {ready
                  ? 'Buka hasil keputusan panitia melalui tombol berikut.'
                  : data.settings.selectionReleaseAt
                    ? `Hasil dapat dibuka pada ${dateLabel(data.settings.selectionReleaseAt, true)}.`
                    : 'Panitia belum menetapkan tanggal pembukaan hasil. Hasil keputusan tetap bersifat privat.'}
              </Text>
            </div>
          </div>
          {ready ? (
            <Button
              onClick={() => {
                setError('')
                setResult(null)
                setCountdown(3)
                setOpened(true)
              }}
            >
              <Eye size={16} />
              Lihat hasil seleksi
            </Button>
          ) : (
            <Badge status="draft">Belum waktunya dibuka</Badge>
          )}
        </div>
      </Panel>
      <Modal open={opened} onClose={close} title="Hasil seleksi MOKA" wide>
        {result ? (
          <div className="py-5 text-center">
            <ShieldCheck
              size={46}
              strokeWidth={1.3}
              className={`mx-auto mb-5 ${result.winner ? 'text-success' : 'text-brand'}`}
            />
            <Badge status={result.winner ? 'accepted' : 'rejected'}>
              {result.winner ? 'Lolos administrasi' : 'Belum lolos administrasi'}
            </Badge>
            <Text as="h2" className="mt-5 font-serif text-3xl">
              {result.winner
                ? 'Selamat, kamu lolos tahap administrasi!'
                : 'Terima kasih atas langkah beranimu.'}
            </Text>
            <Text className="mt-4 font-medium">{result.name}</Text>
            <Text className="mx-auto mt-3 max-w-lg text-sm leading-8 text-muted">
              {result.winner
                ? 'Berdasarkan verifikasi panitia, kamu dinyatakan lolos seleksi administrasi dan berhak mengikuti tahap interview.'
                : 'Pada tahap seleksi administrasi ini kamu belum dapat melanjutkan ke tahap berikutnya. Terima kasih telah memperkenalkan potensi dan dedikasimu kepada MOKA.'}
            </Text>
            {result.winner && (
              <div className="mt-6 space-y-3 text-left">
                {(result.interviews ?? data.interviews).length ? (
                  (result.interviews ?? data.interviews).map((item) => (
                    <div key={item.id} className="rounded-xl border border-line bg-canvas p-4">
                      <Text className="mb-3 text-xs font-semibold">
                        Jadwal interview dari panitia
                      </Text>
                      <Text className="flex items-center gap-2 text-xs">
                        <CalendarDays size={15} />
                        {dateLabel(item.date, true)}
                      </Text>
                      <Text className="mt-2 flex items-center gap-2 text-xs">
                        <MapPin size={15} />
                        {item.location}
                      </Text>
                      {item.note && (
                        <Text className="mt-3 whitespace-pre-wrap text-xs leading-6 text-muted">
                          {item.note}
                        </Text>
                      )}
                    </div>
                  ))
                ) : (
                  <Alert className="!text-xs">
                    Jadwal interview akan tersedia setelah dipublikasikan panitia untuk akunmu.
                  </Alert>
                )}
              </div>
            )}
            <Button className="mt-7" onClick={close}>
              Kembali ke dashboard
            </Button>
          </div>
        ) : error ? (
          <>
            <Alert tone="error">{error}</Alert>
            <Button className="mt-6" onClick={close}>
              Tutup
            </Button>
          </>
        ) : (
          <div
            aria-live="polite"
            aria-atomic="true"
            className="flex min-h-72 flex-col items-center justify-center py-8"
          >
            <Text className="text-[10px] uppercase tracking-[0.2em] text-muted">
              Sebuah langkah, sebuah cerita.
            </Text>
            <Text className="my-8 font-serif text-8xl text-brand">
              {countdown && countdown > 0 ? countdown : '…'}
            </Text>
            <Text className="text-sm text-muted">
              {countdown === 0
                ? 'Membuka hasil keputusan panitia…'
                : 'Bersiap melihat hasil seleksimu.'}
            </Text>
          </div>
        )}
      </Modal>
    </>
  )
}
