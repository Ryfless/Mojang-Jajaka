import { ArrowRight, CalendarDays } from 'lucide-react'
import { registrationIsClosed, selectionIsOpen } from '@/lib/moka-policy'
import { Badge, Button, Text } from './ui'
import { dateLabel, type WorkspaceData } from './types'
import { useServerClock } from './use-server-clock'

export default function ActiveSchedule({
  data,
  onManage,
}: {
  data: WorkspaceData
  onManage: () => void
}) {
  const now = useServerClock(data.serverTime)
  const releasePhase = registrationIsClosed(data.settings, now)
  const date = releasePhase ? data.settings.selectionReleaseAt : data.settings.registrationDeadline
  const opened = selectionIsOpen(data.settings, now)
  return (
    <section className="mb-7 rounded-xl bg-cocoa p-6 text-ivory">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CalendarDays size={23} className="mt-1 text-gold-light" />
          <div>
            <Text as="h2" className="font-serif text-2xl">
              {releasePhase ? 'Pembukaan hasil seleksi' : 'Batas akhir pendaftaran'}
            </Text>
            <Text className="mt-3 text-sm text-ivory">
              {date ? dateLabel(date, true) : 'Jadwal belum ditetapkan'}
            </Text>
            <Text className="mt-2 max-w-2xl text-xs leading-7 text-champagne/80">
              {releasePhase
                ? 'Pendaftaran peserta baru telah ditutup. Hasil seleksi dapat dibuka peserta setelah jadwal pembukaan tiba.'
                : 'Calon peserta dapat membuat akun, mengisi formulir, dan mengirim pendaftaran sebelum batas waktu ini berakhir.'}
            </Text>
          </div>
        </div>
        <span className="[&>span]:bg-champagne/10 [&>span]:text-gold-light">
          <Badge status={date ? (releasePhase && opened ? 'received' : 'pending') : 'draft'}>
            {!date
              ? 'Belum ditetapkan'
              : releasePhase && opened
                ? 'Hasil sudah dibuka'
                : 'Terjadwal'}
          </Badge>
        </span>
      </div>
      <div className="mt-5 border-t border-champagne/15 pt-4">
        <Button
          variant="ghost"
          className="!min-h-6 !p-0 !text-xs !text-gold-light"
          onClick={onManage}
        >
          Kelola jadwal
          <ArrowRight size={15} />
        </Button>
      </div>
    </section>
  )
}
