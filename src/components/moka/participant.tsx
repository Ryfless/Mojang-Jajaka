import { useState, type FormEvent } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FolderOpen,
  Info,
  LockKeyhole,
  MapPin,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import {
  cvTemplateDummyURL,
  documentStatusLabels,
  documentTypes,
  downloadTemplateTypes,
  uploadDocumentTypes,
  templateURL,
  requirements,
  statusLabels,
} from '@/lib/moka'
import { registrationIsClosed, selectionIsOpen } from '@/lib/moka-policy'
import { mokaApi, uploadMockDocument } from '@/services/moka-mock-service'
import type { Interview, MokaDocument } from '@/types/moka'
import {
  Alert,
  AppLink,
  Badge,
  Button,
  Checkbox,
  Empty,
  Field,
  Input,
  Modal,
  Panel,
  Stepper,
  Text,
  Textarea,
} from './ui'
import { dateLabel, type ParticipantProps } from './types'
import FilePreview from './file-preview'
import SelectionResult from './selection-result'
import ProfilePicture from './profile-picture'
import ProfilePhotoEditor from './profile-photo-editor'
import { useServerClock } from './use-server-clock'

export function PageTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Text className="mb-2 text-[10px] font-semibold uppercase tracking-[0.17em] text-brand">
          {eyebrow}
        </Text>
        <Text as="h1" className="font-serif text-3xl leading-tight tracking-tight sm:text-4xl">
          {title}
        </Text>
        {description && (
          <Text className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</Text>
        )}
      </div>
      {children}
    </div>
  )
}

export function ScheduleCard({ schedule }: { schedule: Interview }) {
  return (
    <Panel>
      <div className="mb-5 flex items-center justify-between gap-4">
        <Text as="h3" className="font-serif text-xl">
          Jadwal interview
        </Text>
        <Badge status={schedule.status ?? 'draft'}>
          {schedule.status === 'published'
            ? 'Terpublikasi'
            : schedule.status === 'cancelled'
              ? 'Dibatalkan'
              : 'Draft'}
        </Badge>
      </div>
      <div className="space-y-4 text-sm">
        <div className="flex gap-3">
          <CalendarDays size={19} className="text-brand" />
          <div>
            <Text className="font-medium">{dateLabel(schedule.date, true)}</Text>
            <Text className="mt-1 text-xs text-muted">Waktu Indonesia Barat (UTC+7)</Text>
          </div>
        </div>
        <div className="flex gap-3">
          <MapPin size={19} className="text-brand" />
          <Text>{schedule.location}</Text>
        </div>
        {schedule.note && (
          <Text className="rounded-lg bg-canvas p-4 text-xs leading-6 text-muted">
            {schedule.note}
          </Text>
        )}
        {schedule.link && /^https?:\/\//.test(schedule.link) && (
          <AppLink
            href={schedule.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-brand"
          >
            Buka tautan dari panitia
            <ArrowRight size={15} />
          </AppLink>
        )}
      </div>
    </Panel>
  )
}

function DocumentUpload({
  type,
  doc,
  locked,
  onUploaded,
  notify,
}: {
  type: (typeof uploadDocumentTypes)[number]
  doc?: MokaDocument
  locked: boolean
  onUploaded: () => Promise<void>
  notify: (message: string) => void
}) {
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)
  const [editing, setEditing] = useState(false)

  const upload = async (file?: File) => {
    if (!file) return
    setProgress(0)
    setError('')
    try {
      await uploadMockDocument(type.key, file, (pct) => setProgress(pct))
      await onUploaded()
      setEditing(false)
      notify(`${type.name} berhasil diunggah.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unggahan gagal. Coba lagi.')
    } finally {
      setProgress(null)
    }
  }

  return (
    <div className="rounded-xl border border-line bg-paper p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${doc ? 'bg-success/8 text-success' : 'bg-brand/5 text-brand'}`}
        >
          {doc ? <FileCheck2 size={20} /> : <FileText size={20} />}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Text as="h3" className="text-sm font-semibold">
              {type.name}
            </Text>
            {!type.required && (
              <span className="rounded bg-canvas px-1.5 py-0.5 text-[9px] text-muted">
                Opsional
              </span>
            )}
          </div>
          <Text className="mt-1.5 text-xs leading-6 text-muted">{type.description}</Text>
        </div>
      </div>
      <div className="mb-3">
        <Badge status={doc?.reviewStatus || 'draft'}>
          {doc ? documentStatusLabels[doc.reviewStatus || 'uploaded'] : 'Belum diunggah'}
        </Badge>
      </div>
      {doc && (
        <div className="mb-3 flex flex-wrap items-center gap-2 overflow-hidden rounded-lg bg-canvas px-3 py-2.5">
          <FileText size={15} className="shrink-0 text-brand" />
          <Text className="min-w-0 flex-1 truncate text-xs">
            {doc.originalName || doc.filename}
          </Text>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="!min-h-6 !p-0 !text-[11px] !font-semibold"
              onClick={() => setPreview(true)}
            >
              Tinjau berkas
            </Button>
            {!locked && (
              <Button
                variant="ghost"
                className="!min-h-6 !p-0 !text-[11px] !font-semibold !text-ink hover:!text-brand"
                onClick={() => setEditing((prev) => !prev)}
              >
                {editing ? 'Batal ubah' : 'Ubah berkas'}
              </Button>
            )}
          </div>
        </div>
      )}
      {!locked && (!doc || editing) && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            if (progress === null) void upload(e.dataTransfer.files[0])
          }}
          className="rounded-lg border border-dashed border-line bg-canvas/35 p-4 text-center"
        >
          <Input
            aria-label={`Unggah ${type.name}`}
            type="file"
            disabled={progress !== null}
            onChange={(e) => {
              void upload(e.target.files?.[0])
              e.target.value = ''
            }}
            className="!min-h-0 !border-0 !bg-transparent !p-0 !text-xs file:mr-3 file:rounded-md file:border-0 file:bg-brand/8 file:px-3 file:py-2 file:text-xs file:font-medium file:text-brand"
          />
          <Text className="mt-2 text-[9px] leading-5 text-muted">
            Pilih atau tarik berkas ke sini{doc ? ' untuk mengganti' : ''}.
          </Text>
        </div>
      )}
      {progress !== null && (
        <div className="mt-3">
          <progress max="100" value={progress} className="h-1.5 w-full accent-brand" />
          <Text className="mt-1 text-[10px] text-brand">
            {progress === 100 ? 'Menyimpan berkas…' : `Mengunggah ${progress}%`}
          </Text>
        </div>
      )}
      {error && (
        <Alert tone="error" className="mt-3 !text-xs">
          {error}
        </Alert>
      )}
      <FilePreview document={preview ? doc : undefined} onClose={() => setPreview(false)} />
    </div>
  )
}

export default function ParticipantViews(props: ParticipantProps) {
  const { data, page, navigate, refresh, notify, profile, setProfile, onboarding = false } = props
  const application = data.applications[0]
  const status = application?.status || 'draft'
  const now = useServerClock(data.serverTime)
  const regClosed = registrationIsClosed(data.settings, now)
  const resultsOpen = selectionIsOpen(data.settings, now)
  const locked = status !== 'draft' || regClosed
  const canUpdateDocs = status === 'draft' && !regClosed
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  const [editProfileModal, setEditProfileModal] = useState(false)
  const [previewDoc, setPreviewDoc] = useState<MokaDocument | undefined>()
  const [declaration, setDeclaration] = useState(false)
  const requiredTypes = documentTypes.filter((type) => type.required)
  const getDoc = (key: string) => data.documents.find((doc) => doc.kind === key)
  const count = requiredTypes.filter((type) => getDoc(type.key)).length
  const cvTemplateUrl = templateURL(data.settings.cvTemplate, cvTemplateDummyURL)

  const profileComplete = !!(
    profile.fullName &&
    profile.phone &&
    profile.category &&
    profile.birthDate &&
    profile.height &&
    profile.weight &&
    profile.education &&
    profile.address &&
    profile.district &&
    profile.eligibility
  )
  const missing = requiredTypes.filter((type) => !getDoc(type.key))

  async function save(next?: string) {
    setBusy(true)
    setError('')
    try {
      await mokaApi('save', profile, 'participant')
      await refresh()
      notify('Draft pendaftaran berhasil disimpan.')
      if (next) navigate(next)
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  async function submit() {
    setBusy(true)
    setError('')
    try {
      await mokaApi('submit', {}, 'participant')
      await refresh()
      setConfirm(false)
      navigate(onboarding ? 'dashboard' : 'status')
      notify('Pendaftaran berhasil dikirim. Selamat datang di dashboard peserta!')
    } catch (e) {
      setError((e as Error).message)
      setConfirm(false)
    } finally {
      setBusy(false)
    }
  }

  const update = (key: keyof typeof profile, value: string | boolean) =>
    setProfile({ ...profile, [key]: value })

  if (page === 'dashboard') {
    const primaryInterview = data.interviews[0]
    return (
      <>
        <PageTitle
          eyebrow="Ruang peserta"
          title={`Sampurasun, ${data.user.name.split(' ')[0]}.`}
          description="Pantau proses verifikasi administrasi, tinjau berkas pendaftaranmu, serta buka hasil seleksi saat waktunya tiba."
        />
        <SelectionResult data={data} />
        <div className="mb-7 grid gap-5 lg:grid-cols-[1.65fr_1fr]">
          <div className="relative overflow-hidden rounded-xl bg-cocoa p-7 text-ivory sm:p-8">
            <div className="absolute -right-12 -top-12 size-56 rounded-full border border-gold/15" />
            <div className="absolute -right-4 -top-4 size-40 rounded-full border border-gold/15" />
            <Text className="text-[10px] tracking-[0.17em] text-champagne/80">
              PENDAFTARAN MOJANG JAJAKA
            </Text>
            <Text as="h2" className="mt-5 font-serif text-3xl">
              Pendaftaranmu telah tercatat.
            </Text>
            <Text className="mt-3 max-w-md text-xs leading-7 text-ivory/85">
              Seluruh data dan berkas yang kamu kirim sudah terkunci untuk pemeriksaan panitia.
              Kamu tetap dapat meninjau dan mengunduh dokumenmu kapan saja.
            </Text>
            <Button
              className="mt-6 !border-champagne !bg-champagne !text-cocoa hover:!bg-ivory"
              onClick={() => navigate('status')}
            >
              Lihat status & verifikasi
              <ArrowRight size={16} />
            </Button>
            <Text className="mt-6 text-[10px] text-champagne/80">
              {data.settings.registrationNote ||
                'Periode pendaftaran aktif menunggu konfirmasi panitia.'}
            </Text>
          </div>
          <Panel className="flex flex-col justify-between">
            <div>
              <div className="mb-5 flex items-center justify-between">
                <Text className="text-xs font-medium text-muted">Status administrasi</Text>
                <ShieldCheck size={19} className="text-brand" />
              </div>
              <Badge status={status}>{statusLabels[status]}</Badge>
              <Text as="h3" className="mt-5 font-serif text-2xl">
                {status === 'accepted'
                  ? 'Lolos tahap administrasi.'
                  : status === 'rejected'
                    ? 'Belum lolos administrasi.'
                    : 'Sedang dalam verifikasi.'}
              </Text>
              <Text className="mt-3 text-xs leading-7 text-muted">
                {status === 'accepted'
                  ? 'Selamat! Kamu memenuhi persyaratan administrasi. Pantau kartu hasil seleksi di atas.'
                  : status === 'rejected'
                    ? application?.reviewNote ||
                      'Terima kasih telah mendaftar. Periksa catatan keputusan panitia di menu Status & verifikasi.'
                    : 'Panitia sedang meninjau kelengkapan data dan seluruh berkas yang telah dikirim.'}
              </Text>
            </div>
            <Button
              variant="ghost"
              className="mt-5 !justify-start !px-0 !text-xs"
              onClick={() => navigate('status')}
            >
              Lihat perkembangan
              <ArrowRight size={14} />
            </Button>
          </Panel>
        </div>
        <Panel className="mb-7">
          <Text as="h3" className="mb-6 text-sm font-semibold">
            Langkah pendaftaranmu
          </Text>
          <Stepper current={['accepted', 'rejected'].includes(status) ? 3 : 2} />
        </Panel>
        <div className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
          <Panel>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <Text as="h3" className="font-serif text-xl">
                  Berkas pendaftaranmu
                </Text>
                <Text className="mt-1 text-xs text-muted">
                  Tersimpan dalam mode baca saja (read-only).
                </Text>
              </div>
              <span className="text-xs font-medium text-brand">
                {count} / {requiredTypes.length} lengkap
              </span>
            </div>
            <progress
              max={requiredTypes.length}
              value={count}
              className="mb-5 h-1.5 w-full accent-brand"
            />
            <div className="space-y-0">
              {uploadDocumentTypes.map((type) => {
                const doc = getDoc(type.key)
                if (!doc && !type.required) return null
                return (
                  <div
                    key={type.key}
                    className="flex flex-wrap items-center gap-3 border-b border-line/65 py-3 last:border-0"
                  >
                    {doc ? (
                      <CheckCircle2 size={16} className="shrink-0 text-success" />
                    ) : (
                      <span className="size-4 shrink-0 rounded-full border border-line" />
                    )}
                    <div className="min-w-0 flex-1">
                      <Text className="text-xs font-medium">{type.name}</Text>
                      <Text className="mt-0.5 truncate text-[10px] text-muted">
                        {doc
                          ? `${doc.originalName || doc.filename} · ${documentStatusLabels[doc.reviewStatus || 'uploaded']}`
                          : 'Belum diunggah'}
                      </Text>
                    </div>
                    {doc ? (
                      <Button
                        variant="ghost"
                        className="!min-h-7 !px-2 !py-1 !text-[11px]"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <Eye size={13} />
                        Tinjau
                      </Button>
                    ) : (
                      <span className="text-[10px] text-muted">-</span>
                    )}
                  </div>
                )
              })}
            </div>
            <Button
              variant="ghost"
              className="mt-4 !min-h-8 !px-0 !text-xs"
              onClick={() => navigate('documents')}
            >
              Lihat seluruh dokumen & template
              <ArrowRight size={14} />
            </Button>
          </Panel>
          <div className="space-y-6">
            <Panel>
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <UserRound size={18} className="text-brand" />
                  <Text as="h3" className="font-serif text-xl">
                    Ringkasan data diri
                  </Text>
                </div>
                <Badge status={status}>{profile.category || 'Peserta'}</Badge>
              </div>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3.5 text-xs">
                <div>
                  <dt className="text-[10px] text-muted">Tinggi & berat badan</dt>
                  <dd className="mt-1 font-medium">
                    {profile.height || '-'} cm · {profile.weight || '-'} kg
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted">Kecamatan</dt>
                  <dd className="mt-1 font-medium">{profile.district || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted">Pendidikan / aktivitas</dt>
                  <dd className="mt-1 font-medium">{profile.education || '-'}</dd>
                </div>
                <div>
                  <dt className="text-[10px] text-muted">Tanggal kirim</dt>
                  <dd className="mt-1 font-medium">{dateLabel(application?.submittedAt)}</dd>
                </div>
              </dl>
              <Button
                variant="ghost"
                className="mt-4 !min-h-7 !px-0 !text-xs"
                onClick={() => navigate('profile')}
              >
                Lihat profil saya
                <ArrowRight size={14} />
              </Button>
            </Panel>

            {primaryInterview ? (
              <ScheduleCard schedule={primaryInterview} />
            ) : (
              <div className="flex gap-3 rounded-xl border border-gold/25 bg-gold/5 p-5">
                <Info size={19} className="mt-0.5 shrink-0 text-gold-dark" />
                <div>
                  <Text className="text-xs font-semibold text-ink">
                    Informasi tahap berikutnya & berkas fisik
                  </Text>
                  <Text className="mt-2 text-xs leading-6 text-muted">
                    {profile.category
                      ? `Paket ${profile.category} menggunakan map warna ${profile.category === 'Mojang' ? 'merah' : 'biru'}. `
                      : ''}
                    {data.settings.physicalNote ||
                      'Jadwal interview akan muncul otomatis apabila kamu dinyatakan lolos administrasi dan jadwal dipublikasikan oleh panitia.'}
                  </Text>
                </div>
              </div>
            )}
          </div>
        </div>
        <FilePreview document={previewDoc} onClose={() => setPreviewDoc(undefined)} />
      </>
    )
  }

  if (page === 'form')
    return (
      <>
        <PageTitle
          eyebrow="Alur pendaftaran · Langkah 01 dari 03"
          title="Cerita tentang dirimu."
          description="Kenalkan dirimu, pilih kategori, lengkapi tinggi dan berat badan, serta periksa persyaratan sebelum menyiapkan dokumen."
        />
        {status === 'draft' && regClosed ? (
          <Alert tone="error" className="mb-6">
            Batas akhir pendaftaran telah berakhir pada{' '}
            <strong>{dateLabel(data.settings.registrationDeadline, true)}</strong>. Formulir,
            unggahan, dan pengiriman pendaftaran sudah ditutup.
          </Alert>
        ) : locked ? (
          <Alert className="mb-6">
            Pendaftaran sudah dikirim. Data dan dokumen kini bersifat baca saja (read-only) dan
            tidak dapat diubah kembali.
          </Alert>
        ) : null}
        <form
          onSubmit={(e: FormEvent) => {
            e.preventDefault()
            void save('documents')
          }}
          className="space-y-6"
        >
          <Panel>
            <Text as="h2" className="mb-2 font-serif text-xl">
              Pilih kategorimu
            </Text>
            <Text className="mb-5 text-xs leading-6 text-muted">
              Kategori membantu menyesuaikan persyaratan dan paket dokumenmu.
            </Text>
            <div className="grid gap-4 sm:grid-cols-2">
              {['Mojang', 'Jajaka'].map((category) => (
                <Button
                  key={category}
                  disabled={locked}
                  variant="secondary"
                  aria-pressed={profile.category === category}
                  className={`!justify-start !gap-4 !p-5 !text-left ${profile.category === category ? '!border-brand !bg-brand/4' : ''}`}
                  onClick={() => update('category', category)}
                >
                  <span
                    className={`flex size-10 items-center justify-center rounded-full ${category === 'Mojang' ? 'bg-brand/10 text-brand' : 'bg-jajaka/10 text-jajaka'}`}
                  >
                    <UserRound size={20} />
                  </span>
                  <span className="flex-1">
                    <span className="block font-serif text-xl">{category}</span>
                    <span className="mt-1 block text-[10px] font-normal text-muted">
                      Tinggi min. {category === 'Mojang' ? '165' : '170'} cm · Map{' '}
                      {category === 'Mojang' ? 'merah' : 'biru'}
                    </span>
                  </span>
                  <span
                    className={`flex size-4 items-center justify-center rounded-full border ${profile.category === category ? 'border-brand bg-brand text-ivory' : 'border-line'}`}
                  >
                    {profile.category === category && <Check size={11} />}
                  </span>
                </Button>
              ))}
            </div>
          </Panel>
          <Panel>
            <Text as="h2" className="mb-6 font-serif text-xl">
              Data diri & domisili
            </Text>
            <fieldset disabled={locked} className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
              <Field label="Nama lengkap" required>
                <Input
                  value={profile.fullName}
                  onChange={(e) => update('fullName', e.target.value)}
                  autoComplete="name"
                  placeholder="Sesuai KTP / KK"
                />
              </Field>
              <Field label="Nomor telepon" required>
                <Input
                  value={profile.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  type="tel"
                  autoComplete="tel"
                  placeholder="08xxxxxxxxxx"
                />
              </Field>
              <Field label="Tanggal lahir" required>
                <Input
                  type="date"
                  value={profile.birthDate}
                  onChange={(e) => update('birthDate', e.target.value)}
                />
              </Field>
              <Field
                label="Tinggi badan (cm)"
                required
                hint={`Minimum ${profile.category === 'Jajaka' ? '170 cm untuk Jajaka' : '165 cm untuk Mojang'}. Tetap ditinjau panitia.`}
              >
                <Input
                  type="number"
                  min="1"
                  max="300"
                  value={profile.height}
                  onChange={(e) => update('height', e.target.value)}
                  placeholder="Contoh: 170"
                />
              </Field>
              <Field
                label="Berat badan (kg)"
                required
                hint="Isi berat badan aktual dalam kilogram (25–250 kg)."
              >
                <Input
                  type="number"
                  min="25"
                  max="250"
                  value={profile.weight}
                  onChange={(e) => update('weight', e.target.value)}
                  placeholder="Contoh: 58"
                />
              </Field>
              <Field label="Pendidikan / aktivitas saat ini" required>
                <Input
                  value={profile.education}
                  onChange={(e) => update('education', e.target.value)}
                  placeholder="Pelajar, mahasiswa aktif, atau wiraswasta"
                />
              </Field>
              <Field label="Kecamatan" required>
                <Input
                  value={profile.district}
                  onChange={(e) => update('district', e.target.value)}
                  placeholder="Kecamatan di Kabupaten Bogor"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat domisili" required>
                  <Textarea
                    value={profile.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="Alamat lengkap sesuai bukti domisili"
                    autoComplete="street-address"
                  />
                </Field>
              </div>
            </fieldset>
          </Panel>
          <Panel>
            <Text as="h2" className="mb-2 font-serif text-xl">
              Kenali persyaratannya
            </Text>
            <Text className="mb-5 text-xs leading-6 text-muted">
              Acuan dari pamflet pendaftaran. Checklist bukan penetapan kelulusan otomatis.
            </Text>
            <div className="space-y-3">
              {requirements.map((requirement) => (
                <div key={requirement} className="flex gap-3 text-xs leading-6 text-muted">
                  <CheckCircle2 size={15} className="mt-1 shrink-0 text-brand/65" />
                  {requirement}
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-line pt-5">
              <Checkbox
                checked={profile.eligibility}
                disabled={locked}
                onChange={(value) => update('eligibility', value)}
              >
                Saya sudah membaca dan memahami persyaratan pendaftaran. Data dan kelayakan tetap
                akan diverifikasi panitia.
              </Checkbox>
            </div>
          </Panel>
          {error && <Alert tone="error">{error}</Alert>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" onClick={() => void save()} busy={busy} disabled={locked}>
              Simpan draft
            </Button>
            <Button type="submit" busy={busy} disabled={locked || !profile.category}>
              Simpan & lanjut ke dokumen
              <ArrowRight size={16} />
            </Button>
          </div>
        </form>
      </>
    )

  if (page === 'documents')
    return (
      <>
        <PageTitle
          eyebrow={
            onboarding ? 'Alur pendaftaran · Langkah 02 dari 03' : 'Dokumen & template peserta'
          }
          title={onboarding ? 'Siapkan setiap ceritamu.' : 'Tinjau dokumen pendaftaranmu.'}
          description={
            onboarding
              ? 'Unduh template CV dan referensi yang tersedia, lalu unggah lima dokumen wajib sebelum mengirim pendaftaran.'
              : 'Seluruh berkas yang telah dikirim bersifat final. Anda dapat meninjau pratinjau dokumen dan mengunduh ulang salinan berkas.'
          }
        >
          {!onboarding && (
            <Button variant="secondary" onClick={() => setEditProfileModal(true)}>
              <FileText size={15} />
              Tinjau data formulir
            </Button>
          )}
        </PageTitle>
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-paper px-5 py-4">
          <div className="flex items-center gap-3">
            <FolderOpen
              size={21}
              className={profile.category === 'Jajaka' ? 'text-jajaka' : 'text-brand'}
            />
            <div>
              <Text className="text-sm font-semibold">
                {profile.category
                  ? `Paket ${profile.category} · Map ${profile.category === 'Mojang' ? 'merah' : 'biru'}`
                  : 'Kategori belum dipilih'}
              </Text>
              <Text className="mt-1 text-[10px] text-muted">
                Paket digital tidak menggantikan ketentuan map fisik.
              </Text>
            </div>
          </div>
          <Badge status={count === requiredTypes.length ? 'received' : 'draft'}>
            {count} dari {requiredTypes.length} berkas wajib
          </Badge>
        </div>
        {!application && (
          <Alert className="mb-5">
            <span>Simpan data pendaftaran terlebih dahulu untuk mulai mengunggah. </span>
            <Button
              variant="ghost"
              onClick={() => navigate('form')}
              className="!min-h-0 !p-0 !text-xs"
            >
              Buka formulir
              <ArrowRight size={12} />
            </Button>
          </Alert>
        )}
        {status === 'draft' && regClosed && (
          <Alert tone="error" className="mb-5">
            Batas akhir pendaftaran telah berakhir pada{' '}
            <strong>{dateLabel(data.settings.registrationDeadline, true)}</strong>. Formulir,
            unggahan, dan pengiriman pendaftaran sudah ditutup.
          </Alert>
        )}
        {!onboarding && (
          <Alert className="mb-5">
            <div className="flex items-start gap-2">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand" />
              <div>
                <Text className="font-semibold text-ink">
                  Mode baca saja (read-only) setelah pengiriman
                </Text>
                <Text className="mt-1 text-xs">
                  Pendaftaran telah dikirim. Anda hanya dapat meninjau atau mengunduh berkas dan
                  tidak dapat mengubah ataupun menambah dokumen baru.
                </Text>
              </div>
            </div>
          </Alert>
        )}
        {error && (
          <Alert tone="error" className="mb-5">
            {error}
          </Alert>
        )}
        <section className="mb-8">
          <Text as="h2" className="mb-2 font-serif text-xl">
            01. Template dokumen & CV
          </Text>
          <Text className="mb-4 text-xs leading-6 text-muted">
            Surat izin orang tua dan formulir pendaftaran hanya untuk diunduh, sedangkan Template CV
            dapat diunduh terlebih dahulu lalu diisi dan diunggah pada bagian 02 di bawah.
          </Text>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {downloadTemplateTypes.map((type) => {
              const url = templateURL(
                type.key === 'parentPermission'
                  ? data.settings.parentPermissionTemplate
                  : data.settings.registrationFormTemplate,
                type.dummyURL,
              )
              const dummy = url === type.dummyURL
              return (
                <Panel key={type.key} className="flex flex-col justify-between">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="flex size-10 items-center justify-center rounded-lg bg-brand/5 text-brand">
                        <Download size={20} />
                      </span>
                      <div>
                        <Text as="h3" className="text-sm font-semibold">
                          {type.name}
                        </Text>
                        <Text className="mt-1 text-[10px] text-muted">
                          {dummy ? 'PDF Dummy · Unduh saja' : 'Tautan panitia · Unduh saja'}
                        </Text>
                      </div>
                    </div>
                    <Text className="mb-4 text-xs leading-6 text-muted">
                      Hanya perlu diunduh. Tidak perlu diunggah kembali ke portal.
                    </Text>
                  </div>
                  <AppLink
                    href={url}
                    download
                    className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-xs font-semibold text-brand hover:border-brand/40"
                  >
                    <Download size={15} />
                    Unduh template
                  </AppLink>
                </Panel>
              )
            })}
            <Panel className="flex flex-col justify-between !border-brand/30">
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex size-10 items-center justify-center rounded-lg bg-brand/10 text-brand">
                    <FileText size={20} />
                  </span>
                  <div>
                    <Text as="h3" className="text-sm font-semibold">
                      Template Curriculum Vitae (CV)
                    </Text>
                    <Text className="mt-1 text-[10px] text-brand">
                      PDF Dummy · Unduh lalu unggah kembali
                    </Text>
                  </div>
                </div>
                <Text className="mb-4 text-xs leading-6 text-muted">
                  Unduh template CV terlebih dahulu, lengkapi pengalamanmu, lalu unggah pada kartu
                  Curriculum Vitae (CV) di bawah.
                </Text>
              </div>
              <AppLink
                href={cvTemplateUrl}
                download
                className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg border border-brand/30 bg-brand/5 px-4 py-2.5 text-xs font-semibold text-brand hover:bg-brand/10"
              >
                <Download size={15} />
                Unduh template CV
              </AppLink>
            </Panel>
          </div>
        </section>
        {[
          {
            title: '02. Dokumen wajib',
            types: uploadDocumentTypes.filter((d) => d.required),
          },
          { title: '03. Dokumen opsional', types: uploadDocumentTypes.filter((d) => !d.required) },
        ].map((group) => (
          <section key={group.title} className="mb-8">
            <Text as="h2" className="mb-4 font-serif text-xl">
              {group.title}
            </Text>
            <div className="grid items-start gap-4 sm:grid-cols-2">
              {group.types.map((type) => (
                <DocumentUpload
                  key={type.key}
                  type={type}
                  doc={getDoc(type.key)}
                  locked={!canUpdateDocs || !application}
                  onUploaded={refresh}
                  notify={notify}
                />
              ))}
            </div>
          </section>
        ))}
        {onboarding ? (
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => navigate('form')}>
              <ArrowLeft size={16} />
              Kembali ke formulir
            </Button>
            <Button onClick={() => navigate('preview')}>
              Lanjut ke pratinjau & kirim
              <ArrowRight size={16} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => navigate('dashboard')}>
              <ArrowLeft size={16} />
              Kembali ke dashboard
            </Button>
            <Button onClick={() => navigate('status')}>
              Lihat status & verifikasi
              <ArrowRight size={16} />
            </Button>
          </div>
        )}
        <Modal
          open={editProfileModal}
          onClose={() => setEditProfileModal(false)}
          title="Ringkasan data formulir"
          wide
        >
          <div className="space-y-5">
            <fieldset disabled className="grid gap-4 sm:grid-cols-2">
              <Field label="Kategori peserta" required>
                <Input value={profile.category} readOnly disabled />
              </Field>
              <Field label="Nama lengkap" required>
                <Input value={profile.fullName} readOnly disabled />
              </Field>
              <Field label="Nomor telepon" required>
                <Input value={profile.phone} readOnly disabled />
              </Field>
              <Field label="Tanggal lahir" required>
                <Input type="date" value={profile.birthDate} readOnly disabled />
              </Field>
              <Field label="Tinggi badan (cm)" required>
                <Input type="number" value={profile.height} readOnly disabled />
              </Field>
              <Field label="Berat badan (kg)" required>
                <Input type="number" value={profile.weight} readOnly disabled />
              </Field>
              <Field label="Pendidikan / aktivitas" required>
                <Input value={profile.education} readOnly disabled />
              </Field>
              <Field label="Kecamatan" required>
                <Input value={profile.district} readOnly disabled />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Alamat domisili" required>
                  <Textarea value={profile.address} readOnly disabled />
                </Field>
              </div>
            </fieldset>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditProfileModal(false)}>
                Tutup
              </Button>
            </div>
          </div>
        </Modal>
      </>
    )

  if (page === 'preview')
    return (
      <>
        <PageTitle
          eyebrow="Alur pendaftaran · Langkah 03 dari 03"
          title="Satu pemeriksaan terakhir."
          description="Pastikan seluruh data dan berkas sudah benar. Setelah dikirim, pendaftaran bersifat final dan hanya dapat ditinjau."
        />
        {status === 'draft' && regClosed && (
          <Alert tone="error" className="mb-6">
            Batas akhir pendaftaran telah berakhir pada{' '}
            <strong>{dateLabel(data.settings.registrationDeadline, true)}</strong>. Formulir,
            unggahan, dan pengiriman pendaftaran sudah ditutup.
          </Alert>
        )}
        {(!profileComplete || missing.length > 0) && (
          <Alert tone="error" className="mb-6">
            <Text className="font-medium">Pendaftaran belum lengkap.</Text>
            {!profileComplete && (
              <Text className="mt-1 text-xs">
                Lengkapi seluruh data diri (termasuk tinggi & berat badan) dan persetujuan
                persyaratan.
              </Text>
            )}
            {missing.length > 0 && (
              <Text className="mt-1 text-xs">
                Berkas wajib belum diunggah: {missing.map((type) => type.name).join(', ')}.
              </Text>
            )}
          </Alert>
        )}
        <Panel className="mb-6">
          <div className="mb-5 flex items-center justify-between">
            <Text as="h2" className="font-serif text-xl">
              Ringkasan data diri
            </Text>
            <Button
              variant="ghost"
              className="!min-h-6 !p-0 !text-xs"
              onClick={() => navigate('form')}
            >
              Perbaiki data
              <ArrowRight size={13} />
            </Button>
          </div>
          <dl className="grid gap-6 text-sm sm:grid-cols-2">
            {[
              ['Nama lengkap', profile.fullName],
              ['Kategori', profile.category],
              ['Email', data.user.email],
              ['Telepon', profile.phone],
              ['Tanggal lahir', profile.birthDate ? dateLabel(profile.birthDate) : ''],
              ['Tinggi badan', profile.height ? `${profile.height} cm` : ''],
              ['Berat badan', profile.weight ? `${profile.weight} kg` : ''],
              ['Pendidikan / aktivitas', profile.education],
              ['Kecamatan', profile.district],
              ['Domisili', profile.address],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="mb-2 text-xs text-muted">{label}</dt>
                <dd className="leading-6">{value || 'Belum diisi'}</dd>
              </div>
            ))}
          </dl>
        </Panel>
        <Panel className="mb-6">
          <Text as="h2" className="mb-5 font-serif text-xl">
            Berkas terlampir
          </Text>
          <div className="divide-y divide-line">
            {uploadDocumentTypes.map((type) => {
              const doc = getDoc(type.key)
              return (
                <div key={type.key} className="flex flex-wrap items-center gap-3 py-4">
                  <FileText size={18} className="text-brand" />
                  <div className="min-w-0 flex-1">
                    <Text className="text-sm">
                      {type.name}
                      {!type.required && (
                        <span className="ml-2 text-[10px] text-muted">(opsional)</span>
                      )}
                    </Text>
                    <Text className="mt-1 truncate text-[10px] text-muted">
                      {doc?.originalName || doc?.filename || 'Belum diunggah'}
                    </Text>
                  </div>
                  {doc ? (
                    <Button
                      variant="ghost"
                      className="!min-h-7 !p-0 !text-xs !font-medium"
                      onClick={() => setPreviewDoc(doc)}
                    >
                      Tinjau berkas
                    </Button>
                  ) : (
                    <span className="text-xs text-muted">-</span>
                  )}
                </div>
              )
            })}
          </div>
        </Panel>
        <FilePreview document={previewDoc} onClose={() => setPreviewDoc(undefined)} />
        {error && (
          <Alert tone="error" className="mb-6">
            {error}
          </Alert>
        )}
        <Panel>
          <Checkbox checked={declaration} onChange={setDeclaration} disabled={locked}>
            Saya telah memeriksa data dan berkas yang dilampirkan. Saya memahami setelah dikirim
            berkas tidak dapat diubah kembali, dan keputusan seleksi sepenuhnya menjadi kewenangan
            panitia/juri.
          </Checkbox>
          <div className="mt-6 flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => navigate('documents')}>
              <ArrowLeft size={16} />
              Periksa berkas
            </Button>
            <Button
              disabled={locked || !profileComplete || !!missing.length || !declaration}
              onClick={() => setConfirm(true)}
            >
              Kirim pendaftaran
              <ArrowRight size={16} />
            </Button>
          </div>
        </Panel>
        <Modal open={confirm} onClose={() => setConfirm(false)} title="Siap mengirim pendaftaran?">
          <Text className="text-sm leading-7 text-muted">
            Data dan {count} dokumen wajib akan dikirim untuk diperiksa panitia. Setelah pengiriman,
            dokumen hanya dapat ditinjau dan tidak dapat diubah kembali.
          </Text>
          <div className="mt-6 flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setConfirm(false)}>
              Periksa lagi
            </Button>
            <Button onClick={() => void submit()} busy={busy}>
              Ya, kirim pendaftaran
            </Button>
          </div>
        </Modal>
      </>
    )

  if (page === 'status')
    return (
      <>
        <PageTitle
          eyebrow="Perkembangan pendaftaran"
          title="Setiap langkah, terpantau."
          description="Lihat status pemeriksaan dan keputusan administrasi dari panitia."
        />
        <Panel className="mb-6">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <Badge status={status}>{statusLabels[status]}</Badge>
              <Text as="h2" className="mt-5 font-serif text-2xl">
                {status === 'pending'
                  ? 'Terima kasih. Pendaftaranmu telah diterima.'
                  : status === 'accepted'
                    ? 'Kamu lolos tahap administrasi.'
                    : status === 'rejected'
                      ? 'Terima kasih sudah berpartisipasi.'
                      : 'Pendaftaranmu masih berupa draft.'}
              </Text>
              <Text className="mt-3 max-w-xl text-sm leading-7 text-muted">
                {status === 'pending'
                  ? 'Panitia sedang meninjau data dan berkasmu. Berkas bersifat final selama proses seleksi.'
                  : status === 'accepted'
                    ? 'Kelulusan administrasi bukan penetapan pemenang. Ikuti jadwal pembukaan hasil resmi pada Dashboard.'
                    : status === 'rejected'
                      ? 'Keputusan ini diberikan setelah tinjauan administrasi oleh panitia. Jika perlu klarifikasi, hubungi penyelenggara melalui kanal resmi.'
                      : 'Lengkapi formulir dan berkas, kemudian kirim agar pendaftaranmu dapat ditinjau.'}
              </Text>
            </div>
            <ShieldCheck size={40} strokeWidth={1} className="text-brand/40" />
          </div>
          <div className="mt-7 border-t border-line pt-6">
            <Stepper current={locked ? (['accepted', 'rejected'].includes(status) ? 3 : 2) : 1} />
          </div>
        </Panel>
        {application?.reviewNote && (
          <Panel className="mb-6 !border-gold/30">
            <Text className="mb-3 text-xs font-semibold text-brand">CATATAN PANITIA</Text>
            <Text className="whitespace-pre-wrap text-sm leading-8">{application.reviewNote}</Text>
          </Panel>
        )}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Panel>
            <Text className="text-xs text-muted">Pendaftaran dikirim</Text>
            <Text className="mt-3 text-sm font-medium">
              {dateLabel(application?.submittedAt, true)}
            </Text>
          </Panel>
          <Panel>
            <Text className="text-xs text-muted">Pembaruan terakhir</Text>
            <Text className="mt-3 text-sm font-medium">
              {dateLabel(application?.updatedAt, true)}
            </Text>
          </Panel>
        </div>
        <Button onClick={() => navigate('documents')}>
          <ClipboardCheck size={16} />
          Tinjau dokumen terkirim
          <ArrowRight size={16} />
        </Button>
      </>
    )

  if (page === 'schedule')
    return (
      <>
        <PageTitle
          eyebrow="Langkah berikutnya"
          title="Sampai jumpa di interview."
          description="Informasi jadwal pribadi dari panitia. Interview berlangsung di luar sistem."
        />
        {application?.status === 'accepted' && resultsOpen ? (
          data.interviews.length ? (
            <div className="space-y-5">
              {data.interviews.map((interview) => (
                <ScheduleCard key={interview.id} schedule={interview} />
              ))}
            </div>
          ) : (
            <Panel>
              <Empty
                icon={<CalendarDays size={25} />}
                title="Jadwal belum dipublikasikan"
                description="Jadwal akan terlihat setelah panitia menerbitkannya untuk akunmu. Tidak ada tindakan yang diperlukan saat ini."
              />
            </Panel>
          )
        ) : (
          <Panel>
            <Empty
              icon={<ShieldCheck size={25} />}
              title="Jadwal belum tersedia"
              description="Jadwal interview hanya tersedia bagi peserta yang lolos administrasi setelah jadwal pembukaan hasil tiba dan diterbitkan panitia."
            />
          </Panel>
        )}
      </>
    )

  return (
    <>
      <PageTitle
        eyebrow="Akun peserta"
        title="Profilmu di MOKA."
        description="Informasi akun dan ringkasan identitas pendaftaran."
      />
      <Panel>
        <div className="mb-7 flex items-center gap-4">
          <ProfilePicture
            data={data}
            owner={data.user.id}
            name={data.user.name}
            portrait
            className="h-24 w-16 text-2xl"
          />
          <div>
            <Text as="h2" className="font-serif text-2xl">
              {data.user.name}
            </Text>
            <Text className="mt-1 text-sm text-muted">
              Peserta · {profile.category || 'Kategori belum dipilih'}
            </Text>
          </div>
        </div>
        <div className="mb-7">
          <ProfilePhotoEditor data={data} refresh={refresh} notify={notify} />
        </div>
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Email akun</dt>
            <dd className="mt-2 text-sm">{data.user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Status pendaftaran</dt>
            <dd className="mt-2">
              <Badge status={status}>{statusLabels[status]}</Badge>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Tinggi / berat badan</dt>
            <dd className="mt-2 text-sm">
              {profile.height || '-'} cm · {profile.weight || '-'} kg
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Kecamatan domisili</dt>
            <dd className="mt-2 text-sm">{profile.district || '-'}</dd>
          </div>
        </dl>
        <Alert className="mt-7 !text-xs">
          Data formulir dan dokumen yang sudah dikirim bersifat final. Anda tetap dapat meninjau
          pratinjau dan mengunduh salinan berkas melalui menu Dokumen & template.
        </Alert>
        <Button variant="secondary" className="mt-6" onClick={() => navigate('documents')}>
          Tinjau dokumen & pendaftaran
          <ArrowRight size={15} />
        </Button>
      </Panel>
    </>
  )
}
