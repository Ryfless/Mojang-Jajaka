import { useState } from 'react'
import { CalendarClock, LockKeyhole } from 'lucide-react'
import {
  fromWIBInput,
  registrationIsClosed,
  selectionIsOpen,
  toWIBInput,
} from '@/lib/moka-policy'
import { mokaApi } from '@/services/moka-mock-service'
import { Alert, Badge, Button, Field, Input, Modal, Panel, Text } from './ui'
import { dateLabel, type SharedProps } from './types'
import { useServerClock } from './use-server-clock'

function PolicySettingsForm({
  data,
  refresh,
  notify,
}: Pick<SharedProps, 'data' | 'refresh' | 'notify'>) {
  const [deadline, setDeadline] = useState(toWIBInput(data.settings.registrationDeadline))
  const [release, setRelease] = useState(toWIBInput(data.settings.selectionReleaseAt))
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const now = useServerClock(data.serverTime)
  const regClosed = registrationIsClosed(data.settings, now)

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await mokaApi(
        'settings',
        {
          registrationDeadline: fromWIBInput(deadline),
          selectionReleaseAt: fromWIBInput(release),
        },
        'committee',
      )
      await refresh()
      setConfirm(false)
      notify('Jadwal batas pendaftaran dan pembukaan hasil berhasil disimpan.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Panel className="mb-7">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Text as="h2" className="flex items-center gap-2.5 font-serif text-xl">
            <CalendarClock size={20} className="text-brand" />
            Jadwal hasil & batas pendaftaran
          </Text>
          <Text className="mt-2 max-w-2xl text-xs leading-6 text-muted">
            Atur tenggat akhir registrasi agar sistem menutup pendaftaran otomatis saat waktu habis,
            serta tentukan waktu pembukaan hasil seleksi bagi peserta.
          </Text>
        </div>
        <Badge status={selectionIsOpen(data.settings, now) ? 'published' : 'draft'}>
          {selectionIsOpen(data.settings, now) ? 'Waktu hasil sudah dibuka' : 'Hasil masih privat'}
        </Badge>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          setError('')
          setConfirm(true)
        }}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            label="Batas akhir pendaftaran (WIB)"
            hint="Setelah batas ini lewat, halaman daftar dan wizard pendaftaran otomatis dikunci sehingga tidak dapat registrasi lagi."
          >
            <Input
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>
          <Field
            label="Tanggal & waktu pembukaan hasil (WIB)"
            hint="Kosong berarti hasil belum dibuka. Semua peserta melihat tombol hasil saat waktu ini tiba."
          >
            <Input
              type="datetime-local"
              value={release}
              onChange={(e) => setRelease(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
          <Text className="flex items-center gap-2 text-xs text-muted">
            <LockKeyhole size={14} />
            {regClosed
              ? 'Pendaftaran baru sudah ditutup.'
              : data.settings.registrationDeadline
                ? `Pendaftaran dibuka sampai ${dateLabel(data.settings.registrationDeadline, true)}.`
                : 'Batas akhir pendaftaran belum ditetapkan.'}
          </Text>
          <Button type="submit">Simpan jadwal & batas pendaftaran</Button>
        </div>
      </form>
      <Modal
        open={confirm}
        onClose={() => !busy && setConfirm(false)}
        title="Konfirmasi pengaturan jadwal"
      >
        <dl className="space-y-5 text-sm">
          <div>
            <dt className="mb-1 text-xs text-muted">Batas akhir pendaftaran</dt>
            <dd>{deadline ? dateLabel(fromWIBInput(deadline), true) : 'Belum ditetapkan'}</dd>
          </div>
          <div>
            <dt className="mb-1 text-xs text-muted">Pembukaan hasil seleksi</dt>
            <dd>
              {release
                ? dateLabel(fromWIBInput(release), true)
                : 'Belum dibuka / tidak dijadwalkan'}
            </dd>
          </div>
        </dl>
        <Alert className="mt-6 !text-xs">
          Tanggal yang sudah lewat langsung berlaku setelah disimpan. Apabila batas pendaftaran telah
          lewat, calon peserta tidak dapat membuat akun atau mengirim pendaftaran baru.
        </Alert>
        {error && (
          <Alert tone="error" className="mt-4">
            {error}
          </Alert>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
            Periksa lagi
          </Button>
          <Button busy={busy} onClick={() => void save()}>
            Ya, simpan pengaturan
          </Button>
        </div>
      </Modal>
    </Panel>
  )
}

export default function PolicySettings(props: Pick<SharedProps, 'data' | 'refresh' | 'notify'>) {
  const settingsKey = `${props.data.settings.registrationDeadline ?? ''}|${props.data.settings.selectionReleaseAt ?? ''}`
  return <PolicySettingsForm key={settingsKey} {...props} />
}
