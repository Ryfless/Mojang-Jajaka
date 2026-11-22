import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileText,
  Pencil,
  Plus,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react'
import { documentStatusLabels, statusLabels, uploadDocumentTypes } from '@/lib/moka'
import { documentReviewState } from '@/lib/moka-review'
import { initialDirectoryState } from '@/lib/participant-directory'
import { mokaApi } from '@/services/moka-mock-service'
import type { Application, Interview, MokaDocument } from '@/types/moka'
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Empty,
  Field,
  Input,
  Modal,
  Panel,
  RadioOption,
  Text,
  Textarea,
} from './ui'
import { PageTitle, ScheduleCard } from './participant'
import { dateLabel, ownerID, type SharedProps } from './types'
import FilePreview from './file-preview'
import PolicySettings from './policy-settings'
import ThemeSettings from './theme-settings'
import ParticipantDirectory from './participant-directory'
import ProfilePicture from './profile-picture'
import ReviewMetadata from './review-metadata'
import AICVSimulation from './ai-cv-simulation'
import ActiveSchedule from './active-schedule'

type Confirmation = { title: string; description: string; action: () => Promise<void> }

function ParticipantTable({
  items,
  data,
  onDetail,
}: {
  items: Application[]
  data: SharedProps['data']
  onDetail: (item: Application) => void
}) {
  return (
    <div className="relative overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="border-y border-line bg-canvas/65 text-[10px] uppercase tracking-wider text-muted">
            <th className="px-5 py-4 font-medium">Peserta</th>
            <th className="px-5 py-4 font-medium">Kategori</th>
            <th className="px-5 py-4 font-medium">Status administrasi</th>
            <th className="px-5 py-4 font-medium">Pemeriksaan dokumen</th>
            <th className="px-5 py-4 font-medium">
              <span className="sr-only">Aksi</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.map((item) => (
            <tr key={item.id} className="transition-colors hover:bg-canvas/50">
              <td className="min-w-48 px-5 py-4">
                <div className="flex items-center gap-3">
                  <ProfilePicture
                    data={data}
                    owner={ownerID(item.owner)}
                    name={item.fullName || 'Peserta'}
                  />
                  <div>
                    <Text className="font-semibold">
                      {item.fullName || 'Data belum dilengkapi'}
                    </Text>
                    <Text className="mt-1 text-[10px] text-muted">
                      ID {item.id.slice(0, 8).toUpperCase()}
                    </Text>
                  </div>
                </div>
              </td>
              <td className="px-5 py-4">
                <span className={item.category === 'Jajaka' ? 'text-jajaka' : 'text-brand'}>
                  {item.category || '-'}
                </span>
              </td>
              <td className="px-5 py-4">
                <Badge status={item.status || 'draft'}>
                  {statusLabels[item.status || 'draft']}
                </Badge>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-muted">
                {(() => {
                  const state = documentReviewState(
                    data.documents.filter(
                      (document) => ownerID(document.owner) === ownerID(item.owner),
                    ),
                  )
                  return `${state.reviewed}/${state.total} · ${state.complete ? 'Sudah diperiksa semua' : 'Belum diperiksa'}`
                })()}
              </td>
              <td className="px-5 py-4">
                <Button
                  variant="ghost"
                  className="!min-h-8 !gap-1 !px-0 !text-xs"
                  onClick={() => onDetail(item)}
                >
                  Detail
                  <ChevronRight size={14} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!items.length && (
        <Empty
          icon={<Users size={24} />}
          title="Belum ada peserta yang sesuai"
          description="Pendaftaran peserta akan muncul di sini. Coba ubah kata kunci atau filter jika pencarian tidak menghasilkan data."
        />
      )}
    </div>
  )
}

export default function CommitteeViews({ data, page, navigate, refresh, notify }: SharedProps) {
  const [directory, setDirectory] = useState(initialDirectoryState)
  const [scheduleTab, setScheduleTab] = useState<'interviews' | 'policy'>('interviews')
  const [selected, setSelected] = useState<string | null>(null)
  const [tab, setTab] = useState('data')
  const [decision, setDecision] = useState<'accepted' | 'rejected'>('accepted')
  const [requirementsConfirmed, setRequirementsConfirmed] = useState(false)
  const [note, setNote] = useState('')
  const [inspectedDocId, setInspectedDocId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<Confirmation | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [scheduleEditor, setScheduleEditor] = useState(false)
  const [schedule, setSchedule] = useState({
    id: '',
    date: '',
    location: '',
    link: '',
    note: '',
  })
  const [schedulePreview, setSchedulePreview] = useState(false)
  const app = data.applications.find((item) => item.id === selected)
  const docs = app ? data.documents.filter((doc) => ownerID(doc.owner) === ownerID(app.owner)) : []
  const inspectedDoc = inspectedDocId ? docs.find((doc) => doc.id === inspectedDocId) : undefined
  const counts = {
    total: data.totalApplications,
    pending: data.applications.filter((item) => item.status === 'pending').length,
    accepted: data.applications.filter((item) => item.status === 'accepted').length,
    rejected: data.applications.filter((item) => item.status === 'rejected').length,
  }

  async function perform(action: () => Promise<void>, message: string) {
    setBusy(true)
    setError('')
    try {
      await action()
      await refresh()
      setConfirm(null)
      notify(message)
      return true
    } catch (e) {
      setError((e as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  const openDetail = (item: Application) => {
    setSelected(item.id)
    setInspectedDocId(null)
    setTab('data')
    setNote(item.reviewNote || '')
    setRequirementsConfirmed(item.requirementsConfirmed || false)
    setDecision(item.status === 'rejected' ? 'rejected' : 'accepted')
    setError('')
    navigate('participants')
  }

  const reviewState = documentReviewState(docs)

  async function inspectDocument(doc: MokaDocument) {
    setInspectedDocId(doc.id)
    requestAnimationFrame(() =>
      document
        .getElementById('committee-document-preview')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' }),
    )
    if (doc.reviewStatus === 'received') return
    setBusy(true)
    setError('')
    try {
      await mokaApi('review-document', { id: doc.id, status: 'received' }, 'committee')
      await refresh()
      notify('Dokumen ditandai sudah diperiksa.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const confirmationModal = (
    <Modal
      open={!!confirm}
      onClose={() => {
        if (!busy) setConfirm(null)
      }}
      title={confirm?.title || 'Konfirmasi tindakan'}
    >
      <Text className="text-sm leading-7 text-muted">{confirm?.description}</Text>
      {error && (
        <Alert tone="error" className="mt-5">
          {error}
        </Alert>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" disabled={busy} onClick={() => setConfirm(null)}>
          Batal
        </Button>
        <Button
          busy={busy}
          onClick={() => confirm && void perform(confirm.action, 'Perubahan berhasil disimpan.')}
        >
          Ya, lanjutkan
        </Button>
      </div>
    </Modal>
  )

  if (page === 'settings')
    return (
      <>
        <PageTitle
          eyebrow="Preferensi portal"
          title="Pengaturan tema & identitas."
          description="Sesuaikan palet warna keseluruhan website, logo aplikasi, dan gambar cover halaman masuk/daftar sesuai kebutuhan acara."
        />
        <ThemeSettings data={data} refresh={refresh} notify={notify} />
      </>
    )

  if (page === 'dashboard')
    return (
      <>
        <PageTitle
          eyebrow="Ruang kerja panitia"
          title="Menjaga setiap potensi."
          description="Tinjau pendaftaran dengan saksama, sampaikan keputusan dengan jelas."
        />
        <ActiveSchedule
          data={data}
          onManage={() => {
            setScheduleTab('policy')
            navigate('schedule')
          }}
        />
        <div className="mb-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total pendaftaran', value: counts.total, icon: Users, status: '' },
            {
              label: 'Menunggu pemeriksaan',
              value: counts.pending,
              icon: ClipboardCheck,
              status: 'pending',
            },
            {
              label: 'Lolos administrasi',
              value: counts.accepted,
              icon: ShieldCheck,
              status: 'accepted',
            },
            {
              label: 'Tidak lolos',
              value: counts.rejected,
              icon: XCircle,
              status: 'rejected',
            },
          ].map((metric) => (
            <Panel key={metric.label}>
              <div className="flex items-center justify-between gap-2">
                <Text className="text-[11px] text-muted">{metric.label}</Text>
                <metric.icon
                  size={18}
                  className={
                    metric.status === 'accepted'
                      ? 'text-success'
                      : metric.status === 'rejected'
                        ? 'text-danger'
                        : 'text-brand'
                  }
                />
              </div>
              <Text className="mt-5 font-serif text-4xl">{metric.value}</Text>
              <Text className="mt-3 text-[10px] text-muted">Pendaftaran yang tercatat</Text>
            </Panel>
          ))}
        </div>
        <div className="mb-7 grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Panel>
            <Text as="h2" className="font-serif text-xl">
              Gambaran pendaftaran
            </Text>
            <Text className="mt-2 text-xs leading-6 text-muted">
              Distribusi status dari {data.applications.length} pendaftaran yang dimuat.
            </Text>
            <div
              className="my-6 flex h-5 overflow-hidden rounded-md bg-canvas"
              role="img"
              aria-label={`${counts.pending} menunggu, ${counts.accepted} lolos administrasi, ${counts.rejected} tidak lolos`}
            >
              {data.applications.length > 0 &&
                ['draft', 'pending', 'accepted', 'rejected'].map((key) => (
                  <span
                    key={key}
                    style={{ flex: data.applications.filter((item) => item.status === key).length }}
                    className={
                      key === 'accepted'
                        ? 'bg-success'
                        : key === 'pending'
                          ? 'bg-gold-dark'
                          : key === 'rejected'
                            ? 'bg-danger'
                            : 'bg-line'
                    }
                  />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4 text-[10px] text-muted">
              {[
                ['draft', 'Draft'],
                ['pending', 'Menunggu verifikasi'],
                ['accepted', 'Lolos administrasi'],
                ['rejected', 'Tidak lolos'],
              ].map(([key, label]) => (
                <div key={key} className="flex justify-between gap-3">
                  <span>{label}</span>
                  <span className="font-semibold text-ink">
                    {data.applications.filter((item) => item.status === key).length}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
          <div className="rounded-xl bg-cocoa p-6 text-ivory">
            <ShieldCheck size={23} className="text-gold-light" />
            <Text as="h2" className="mt-5 font-serif text-2xl">
              Teknologi membantu.
              <br />
              Manusia memutuskan.
            </Text>
            <Text className="mt-4 text-xs leading-7 text-ivory/85">
              Verifikasi, hasil seleksi, dan penetapan pemenang tetap berada dalam kewenangan
              panitia dan juri. AI tidak memberikan keputusan akhir.
            </Text>
          </div>
        </div>
        <Panel className="!overflow-hidden !p-0">
          <div className="flex items-center justify-between gap-3 p-6">
            <div>
              <Text as="h2" className="font-serif text-xl">
                Antrean pemeriksaan
              </Text>
              <Text className="mt-2 text-xs text-muted">
                Pendaftaran menunggu tinjauan panitia.
              </Text>
            </div>
            <Button
              variant="ghost"
              className="!px-0 !text-xs"
              onClick={() => {
                setSelected(null)
                setDirectory((current) => ({
                  ...current,
                  group: 'all',
                  status: 'pending',
                  page: 1,
                }))
                navigate('participants')
              }}
            >
              Lihat semua
              <ArrowRight size={14} />
            </Button>
          </div>
          <ParticipantTable
            items={data.applications.filter((item) => item.status === 'pending').slice(0, 5)}
            data={data}
            onDetail={openDetail}
          />
        </Panel>
        <Panel className="mt-6">
          <Text as="h2" className="mb-5 font-serif text-xl">
            Aktivitas terbaru
          </Text>
          {data.applications.length ? (
            data.applications.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 border-b border-line py-3 last:border-0"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-canvas text-brand">
                  <FileText size={15} />
                </span>
                <div className="flex-1">
                  <Text className="text-xs">
                    {item.fullName || 'Peserta'} · {statusLabels[item.status || 'draft']}
                  </Text>
                  <Text className="mt-1 text-[10px] text-muted">
                    Pembaruan terakhir: {dateLabel(item.updatedAt, true)}
                  </Text>
                </div>
              </div>
            ))
          ) : (
            <Text className="text-xs leading-7 text-muted">
              Aktivitas akan tersedia setelah pendaftaran pertama tercatat.
            </Text>
          )}
        </Panel>
      </>
    )

  if (page === 'participants' && app)
    return (
      <>
        <Button
          variant="ghost"
          className="mb-5 !min-h-7 !px-0 !text-xs"
          onClick={() => setSelected(null)}
        >
          <ArrowLeft size={15} />
          Kembali ke daftar peserta
        </Button>
        <PageTitle
          eyebrow={`Detail pendaftaran · ${app.id.slice(0, 8).toUpperCase()}`}
          title={app.fullName || 'Peserta MOKA'}
          description={`${app.category || 'Kategori belum dipilih'} · ${typeof app.owner === 'object' ? app.owner.email : 'Akun peserta'}`}
        >
          <Badge status={app.status || 'draft'}>{statusLabels[app.status || 'draft']}</Badge>
        </PageTitle>
        <div className="mb-6 flex gap-1 border-b border-line">
          {[
            ['data', 'Data peserta'],
            [
              'documents',
              `Dokumen (${docs.filter((doc) => uploadDocumentTypes.some((type) => type.key === doc.kind)).length})`,
            ],
            ['ai', 'AI CV Assist'],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant="ghost"
              className={`!rounded-none !border-x-0 !border-t-0 !px-4 !text-xs ${tab === key ? '!border-b-2 !border-brand' : '!border-b-2 !border-transparent !text-muted'}`}
              onClick={() => setTab(key)}
            >
              {label}
            </Button>
          ))}
        </div>
        <div className="grid items-start gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="space-y-6">
            {tab === 'data' && (
              <Panel>
                <Text as="h2" className="mb-6 font-serif text-xl">
                  Informasi peserta
                </Text>
                <dl className="grid gap-6 sm:grid-cols-2">
                  {[
                    ['Nama lengkap', app.fullName],
                    ['Kategori', app.category],
                    ['Tanggal lahir', dateLabel(app.birthDate)],
                    ['Tinggi badan', app.height ? `${app.height} cm` : null],
                    ['Berat badan', app.weight ? `${app.weight} kg` : null],
                    ['Telepon', app.phone],
                    ['Pendidikan / aktivitas', app.education],
                    ['Kecamatan', app.district],
                    ['Alamat', app.address],
                    ['Pengiriman', dateLabel(app.submittedAt, true)],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="mb-2 text-xs text-muted">{label}</dt>
                      <dd className="text-sm leading-7">{value || 'Belum diisi'}</dd>
                    </div>
                  ))}
                </dl>
                <Alert className="mt-6 !text-xs">
                  Pernyataan pemahaman persyaratan:{' '}
                  {app.eligibility ? 'Sudah disetujui peserta' : 'Belum disetujui'}. Tetap
                  memerlukan verifikasi panitia.
                </Alert>
              </Panel>
            )}
            {tab === 'documents' && (
              <>
                {inspectedDoc && (
                  <div id="committee-document-preview" className="scroll-mt-24">
                    <FilePreview
                      inline
                      document={inspectedDoc}
                      onClose={() => setInspectedDocId(null)}
                    />
                  </div>
                )}
                {uploadDocumentTypes.map((type) => {
                  const doc = docs.find((item) => item.kind === type.key)
                  return (
                    <Panel key={type.key}>
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <Text as="h3" className="text-sm font-semibold">
                          {type.name}
                        </Text>
                        <Badge status={doc?.reviewStatus || 'draft'}>
                          {doc
                            ? documentStatusLabels[doc.reviewStatus || 'uploaded']
                            : 'Belum diunggah'}
                        </Badge>
                      </div>
                      {doc ? (
                        <>
                          <Text className="break-all text-xs text-muted">
                            {doc.originalName || doc.filename}
                          </Text>
                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              variant="secondary"
                              disabled={busy}
                              className="!min-h-8 !px-3 !py-2 !text-xs"
                              onClick={() => void inspectDocument(doc)}
                            >
                              <Eye size={14} />
                              Tinjau
                            </Button>
                          </div>
                          <ReviewMetadata document={doc} data={data} />
                        </>
                      ) : (
                        <Text className="text-xs leading-6 text-muted">
                          {type.required
                            ? 'Dokumen wajib belum tersedia.'
                            : 'Dokumen ini bersifat opsional.'}
                        </Text>
                      )}
                    </Panel>
                  )
                })}
              </>
            )}
            {tab === 'ai' && (
              <AICVSimulation
                hasCV={docs.some((doc) => doc.kind === 'cv')}
                onViewCV={() => {
                  setTab('documents')
                  const cv = docs.find((doc) => doc.kind === 'cv')
                  if (cv) void inspectDocument(cv)
                }}
              />
            )}
          </div>
          <Panel className="xl:sticky xl:top-24">
            <Text as="h2" className="font-serif text-xl">
              Keputusan administrasi
            </Text>
            <Text className="mb-5 mt-3 text-xs leading-7 text-muted">
              Tinjau data dan dokumen sebelum menetapkan keputusan lolos atau tidak lolos.
            </Text>
            <div className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium">Hasil tinjauan</legend>
                {(
                  [
                    ['accepted', 'Lolos administrasi'],
                    ['rejected', 'Tidak lolos administrasi'],
                  ] as const
                ).map(([value, label]) => (
                  <RadioOption
                    key={value}
                    name="administrative-decision"
                    value={value}
                    checked={decision === value}
                    onChange={() => {
                      setDecision(value)
                      setRequirementsConfirmed(false)
                    }}
                  >
                    {label}
                  </RadioOption>
                ))}
              </fieldset>
              {decision === 'accepted' && (
                <>
                  <Alert className="!text-xs">
                    {reviewState.complete
                      ? 'Seluruh dokumen wajib sudah ditinjau dan diperiksa.'
                      : `${reviewState.reviewed}/${reviewState.total} dokumen wajib sudah diperiksa. Tekan Tinjau pada seluruh dokumen wajib sebelum mengonfirmasi kelulusan.`}
                  </Alert>
                  <Checkbox
                    checked={requirementsConfirmed}
                    onChange={setRequirementsConfirmed}
                    disabled={!reviewState.complete}
                  >
                    Saya telah memeriksa dan menyatakan persyaratan administrasi memenuhi ketentuan.
                  </Checkbox>
                </>
              )}
              <Field
                label={`Catatan untuk peserta${decision === 'rejected' ? ' (wajib)' : ''}`}
              >
                <Textarea
                  placeholder="Berikan catatan yang spesifik dan mudah dipahami."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </Field>
              <Button
                className="w-full"
                disabled={
                  app.status === 'draft' ||
                  (decision === 'rejected' && !note.trim()) ||
                  (decision === 'accepted' && (!reviewState.complete || !requirementsConfirmed))
                }
                onClick={() =>
                  setConfirm({
                    title: 'Simpan keputusan administrasi?',
                    description: `Status akan diubah menjadi “${statusLabels[decision]}”. Peserta dapat membaca status dan catatan ini.`,
                    action: async () => {
                      await mokaApi(
                        'review',
                        {
                          id: app.id,
                          status: decision,
                          note,
                          confirmRequirements: requirementsConfirmed,
                        },
                        'committee',
                      )
                    },
                  })
                }
              >
                <ClipboardCheck size={16} />
                Simpan keputusan
              </Button>
            </div>
            {app.decidedAt && (
              <Text className="mt-5 text-[10px] leading-6 text-muted">
                Keputusan oleh {app.decidedByName} · {dateLabel(app.decidedAt, true)}
              </Text>
            )}
            {app.status === 'draft' && (
              <Text className="mt-4 text-[10px] leading-6 text-muted">
                Draft belum dikirim peserta dan belum dapat diputuskan.
              </Text>
            )}
            {error && (
              <Alert tone="error" className="mt-4 !text-xs">
                {error}
              </Alert>
            )}
            <div className="mt-6 flex gap-2 border-t border-line pt-5 text-[10px] leading-6 text-muted">
              <ShieldCheck size={15} className="mt-1 shrink-0" />
              Keputusan ini hanya untuk administrasi, bukan penilaian wawancara.
            </div>
          </Panel>
        </div>
        {confirmationModal}
      </>
    )

  if (page === 'participants')
    return (
      <>
        <PageTitle
          eyebrow="Administrasi pendaftaran"
          title="Kenali setiap potensi."
          description="Cari peserta, tinjau pemeriksaan dokumen, dan tetapkan keputusan administrasi."
        />
        <ParticipantDirectory
          data={data}
          state={directory}
          onChange={setDirectory}
          onDetail={openDetail}
          renderList={(items) => (
            <ParticipantTable items={items} data={data} onDetail={openDetail} />
          )}
        />
      </>
    )

  function editSchedule(item?: Interview) {
    const localDate = item?.date
      ? new Date(new Date(item.date).getTime() + 7 * 3600000).toISOString().slice(0, 16)
      : ''
    setSchedule({
      id: item?.id || '',
      date: localDate,
      location: item?.location || '',
      link: item?.link || '',
      note: item?.note || '',
    })
    setScheduleEditor(true)
    setSchedulePreview(false)
    setError('')
  }

  const canSaveSchedule = !!(schedule.date && schedule.location)

  async function saveSchedule(published: boolean) {
    await perform(
      async () => {
        await mokaApi(
          'schedule',
          { ...schedule, date: `${schedule.date}:00+07:00`, published },
          'committee',
        )
        setScheduleEditor(false)
        setSchedulePreview(false)
      },
      published
        ? 'Jadwal interview berhasil dipublikasikan.'
        : 'Draft jadwal disimpan.',
    )
  }

  const scheduleTabs = (
    <div
      role="tablist"
      aria-label="Pengaturan jadwal"
      className="mb-6 flex flex-wrap gap-1 border-b border-line"
    >
      {(
        [
          ['interviews', 'Jadwal interview'],
          ['policy', 'Jadwal hasil & batas pendaftaran'],
        ] as const
      ).map(([key, label]) => (
        <Button
          key={key}
          role="tab"
          aria-selected={scheduleTab === key}
          variant="ghost"
          className={`!rounded-none !border-x-0 !border-t-0 !border-b-2 !px-4 !text-xs ${scheduleTab === key ? '!border-brand' : '!border-transparent !text-muted'}`}
          onClick={() => setScheduleTab(key)}
        >
          {label}
        </Button>
      ))}
    </div>
  )

  return (
    <>
      <PageTitle
        eyebrow="Manajemen jadwal"
        title={
          scheduleTab === 'policy'
            ? 'Jadwal hasil & batas pendaftaran.'
            : 'Kelola jadwal interview.'
        }
        description={
          scheduleTab === 'policy'
            ? 'Tetapkan batas akhir registrasi peserta serta waktu pembukaan hasil seleksi akhir. Waktu ditampilkan dalam WIB.'
            : 'Jadwal interview ditujukan bagi peserta yang telah dinyatakan lolos administrasi. Tidak ada fitur penilaian wawancara.'
        }
      >
        {scheduleTab === 'interviews' && (
          <Button onClick={() => editSchedule()}>
            <Plus size={16} />
            Buat jadwal
          </Button>
        )}
      </PageTitle>
      {scheduleTabs}
      {scheduleTab === 'policy' ? (
        <PolicySettings data={data} refresh={refresh} notify={notify} />
      ) : (
        <>
          <Alert className="mb-6 !text-xs">
            Jadwal interview berlaku umum bagi seluruh peserta yang lolos administrasi. Peserta baru
            dapat melihat jadwal setelah waktu pembukaan hasil tiba. Waktu ditampilkan dalam WIB
            (UTC+7).
          </Alert>
          {!data.interviews.length ? (
            <Panel>
              <Empty
                icon={<CalendarDays size={25} />}
                title="Belum ada jadwal interview"
                description="Buat draft jadwal, periksa tanggal dan lokasi, lalu publikasikan kepada seluruh peserta yang lolos administrasi."
              >
                <Button onClick={() => editSchedule()}>
                  <Plus size={16} />
                  Buat jadwal pertama
                </Button>
              </Empty>
            </Panel>
          ) : (
            <div className="grid gap-5 lg:grid-cols-2">
              {data.interviews.map((item) => (
                <div key={item.id}>
                  <ScheduleCard schedule={item} />
                  <div className="mt-2 flex gap-2">
                    <Button
                      variant="ghost"
                      className="!min-h-8 !px-1 !text-xs"
                      onClick={() => editSchedule(item)}
                    >
                      <Pencil size={13} />
                      Ubah jadwal
                    </Button>
                    {item.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        className="!min-h-8 !px-2 !text-xs !text-danger"
                        onClick={() =>
                          setConfirm({
                            title: 'Batalkan jadwal interview?',
                            description:
                              'Jadwal ini tidak akan lagi ditampilkan kepada peserta. Konfirmasikan perubahan melalui kanal resmi panitia bila diperlukan.',
                            action: async () => {
                              await mokaApi(
                                'schedule',
                                {
                                  ...item,
                                  cancelled: true,
                                },
                                'committee',
                              )
                            },
                          })
                        }
                      >
                        Batalkan jadwal
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          <Modal
            open={scheduleEditor}
            onClose={() => setScheduleEditor(false)}
            title={
              schedulePreview
                ? 'Konfirmasi publikasi jadwal'
                : schedule.id
                  ? 'Ubah jadwal interview'
                  : 'Buat jadwal interview'
            }
            wide
          >
            {schedulePreview ? (
              <>
                <Text className="text-sm leading-7 text-muted">
                  Jadwal berikut akan terlihat oleh seluruh peserta yang lolos administrasi setelah
                  waktu pembukaan hasil tiba. Periksa kembali sebelum memublikasikan.
                </Text>
                <dl className="mt-6 space-y-4 text-sm">
                  {[
                    ['Tanggal & waktu', dateLabel(`${schedule.date}:00+07:00`, true)],
                    ['Lokasi', schedule.location],
                    ['Catatan', schedule.note || 'Tidak ada catatan tambahan'],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="mb-1 text-xs text-muted">{label}</dt>
                      <dd className="leading-7">{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className="mt-6 flex justify-end gap-3">
                  <Button variant="secondary" onClick={() => setSchedulePreview(false)}>
                    Periksa lagi
                  </Button>
                  <Button busy={busy} onClick={() => void saveSchedule(true)}>
                    Konfirmasi & publikasikan
                  </Button>
                </div>
              </>
            ) : (
              <div className="space-y-5">
                <Field label="Tanggal & waktu (WIB)" required>
              <Input
                type="datetime-local"
                value={schedule.date}
                onChange={(e) => setSchedule({ ...schedule, date: e.target.value })}
              />
            </Field>
            <Field label="Lokasi interview" required>
              <Input
                value={schedule.location}
                onChange={(e) => setSchedule({ ...schedule, location: e.target.value })}
                placeholder="Isi lokasi resmi yang telah dikonfirmasi"
              />
            </Field>
            <Field label="Tautan dari panitia (opsional)">
              <Input
                type="url"
                value={schedule.link}
                onChange={(e) => setSchedule({ ...schedule, link: e.target.value })}
                placeholder="https://"
              />
            </Field>
            <Field label="Catatan / berkas yang perlu dibawa">
              <Textarea
                value={schedule.note}
                onChange={(e) => setSchedule({ ...schedule, note: e.target.value })}
                placeholder="Hanya cantumkan instruksi yang sudah dikonfirmasi."
              />
            </Field>
            <div className="flex flex-wrap justify-end gap-3">
              <Button
                variant="secondary"
                busy={busy}
                disabled={!canSaveSchedule}
                onClick={() => void saveSchedule(false)}
              >
                Simpan draft
              </Button>
              <Button disabled={!canSaveSchedule} onClick={() => setSchedulePreview(true)}>
                Pratinjau & publikasikan
                <ArrowRight size={15} />
              </Button>
            </div>
          </div>
        )}
        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}
      </Modal>
        </>
      )}
      {confirmationModal}
    </>
  )
}
