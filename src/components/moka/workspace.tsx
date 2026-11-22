import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeftRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  FolderOpen,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Palette,
  RotateCcw,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react'
import { PARTICIPANT_SCENARIOS } from '@/data/dummy-moka'
import { documentTypes, emptyProfile, requiredDocumentCount, type Profile } from '@/lib/moka'
import { applyThemeToDocument } from '@/lib/theme'
import {
  getParticipantUsers,
  mokaApi,
  resetMockData,
  setActiveParticipant,
  setActiveRole,
} from '@/services/moka-mock-service'
import { Alert, AppLink, Button, Modal, Select, Text, Wordmark } from './ui'
import Assistant from './assistant'
import ParticipantViews from './participant'
import CommitteeViews from './committee'
import type { WorkspaceData } from './types'

function profileFromWorkspace(result: WorkspaceData): Profile {
  const app = result.applications[0]
  return app
    ? {
        fullName: app.fullName || result.user.name,
        phone: app.phone || '',
        category: app.category || '',
        birthDate: app.birthDate?.slice(0, 10) || '',
        height: app.height ? String(app.height) : '',
        weight: app.weight ? String(app.weight) : '',
        education: app.education || '',
        address: app.address || '',
        district: app.district || '',
        eligibility: app.eligibility || false,
      }
    : { ...emptyProfile, fullName: result.user.name }
}

function WorkspaceContent({ committee = false }: { committee?: boolean }) {
  const navigateRouter = useNavigate()
  const role = committee ? 'committee' : 'participant'
  const [data, setData] = useState<WorkspaceData | null>(null)
  const [page, setPage] = useState('dashboard')
  const [wizardStep, setWizardStep] = useState<'form' | 'documents' | 'preview'>('form')
  const [profile, setProfile] = useState<Profile>(emptyProfile)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [logout, setLogout] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [help, setHelp] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  const refresh = useCallback(async () => {
    const result: WorkspaceData = await mokaApi('workspace', undefined, role)
    applyThemeToDocument(result.settings.theme)
    setData(result)
    if (!committee) {
      setProfile(profileFromWorkspace(result))
    }
  }, [committee, role])

  useEffect(() => {
    let active = true
    mokaApi('workspace', undefined, role)
      .then((result: WorkspaceData) => {
        if (!active) return
        applyThemeToDocument(result.settings.theme)
        setData(result)
        if (!committee) {
          setProfile(profileFromWorkspace(result))
        }
      })
      .catch((e) => {
        if (active) setError((e as Error).message)
      })
    return () => {
      active = false
    }
  }, [committee, role])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(''), 5000)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    const syncOnFocus = () => {
      if (document.hidden) return
      mokaApi('policy', undefined, role)
        .then((result) => {
          applyThemeToDocument(result.settings.theme)
          setData((current) =>
            current
              ? {
                  ...current,
                  settings: result.settings,
                  profilePhotos: result.profilePhotos ?? current.profilePhotos,
                  applications: result.applications ?? current.applications,
                  documents: result.documents ?? current.documents,
                  reviewHistory: result.reviewHistory ?? current.reviewHistory,
                  serverTime: result.serverTime,
                }
              : current,
          )
        })
        .catch(() => {})
    }
    window.addEventListener('focus', syncOnFocus)
    return () => window.removeEventListener('focus', syncOnFocus)
  }, [role])

  const navigate = (next: string) => {
    if (next === 'form' || next === 'documents' || next === 'preview') {
      setWizardStep(next)
    }
    setPage(next)
    setDrawer(false)
    setError('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
    document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const switchRole = (targetCommittee: boolean) => {
    setActiveRole(targetCommittee ? 'committee' : 'participant')
    setDrawer(false)
    navigateRouter(targetCommittee ? '/panitia' : '/peserta')
  }

  const handleScenarioChange = async (userId: string) => {
    setActiveParticipant(userId)
    setPage('dashboard')
    setWizardStep('form')
    setDrawer(false)
    await refresh()
    const scenario = PARTICIPANT_SCENARIOS.find((item) => item.userId === userId)
    setToast(
      scenario
        ? `Beralih ke skenario peserta: ${scenario.shortLabel}`
        : 'Beralih ke akun peserta terpilih.',
    )
  }

  const handleReset = async () => {
    resetMockData()
    setConfirmReset(false)
    setPage('dashboard')
    setWizardStep('form')
    await refresh()
    setToast('Data dummy berhasil dikembalikan ke kondisi awal.')
  }

  const participantOptions = (() => {
    const knownIds = new Set(PARTICIPANT_SCENARIOS.map((item) => item.userId))
    const customUsers = getParticipantUsers().filter((u) => !knownIds.has(u.id))
    return { scenarios: PARTICIPANT_SCENARIOS, customUsers }
  })()

  const app = data?.applications[0]
  const isOnboarding = !committee && (!app || (app.status === 'draft' && !app.submittedAt))
  const eventYear = data?.settings.theme?.eventYear || data?.settings.eventYear || '2026'
  const wizardSteps = [
    {
      key: 'form' as const,
      step: '01',
      label: 'Formulir & persyaratan',
      desc: 'Data diri, kategori, dan syarat',
    },
    {
      key: 'documents' as const,
      step: '02',
      label: 'Upload dokumen',
      desc: 'Template CV & berkas pendukung',
    },
    {
      key: 'preview' as const,
      step: '03',
      label: 'Pratinjau & kirim',
      desc: 'Periksa ulang lalu kirim pendaftaran',
    },
  ]
  const activeWizardIndex = wizardSteps.findIndex((item) => item.key === wizardStep)
  const requiredDocCount = documentTypes.filter(
    (type) => type.required && data?.documents.some((doc) => doc.kind === type.key),
  ).length
  const menu = committee
    ? [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'participants', label: 'Daftar peserta', icon: Users },
        { key: 'schedule', label: 'Manajemen jadwal', icon: CalendarDays },
        { key: 'settings', label: 'Pengaturan', icon: Palette },
      ]
    : [
        { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { key: 'status', label: 'Status & verifikasi', icon: ShieldCheck },
        { key: 'documents', label: 'Dokumen & template', icon: FolderOpen },
      ]
  const pageLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    participants: 'Daftar peserta',
    status: 'Status & verifikasi',
    documents: 'Dokumen & template',
    schedule: 'Manajemen jadwal',
    settings: 'Pengaturan',
    profile: 'Profil saya',
  }
  const currentLabel =
    menu.find((item) => item.key === page)?.label || pageLabels[page] || 'Dashboard'

  if (!data && !error)
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas">
        <Wordmark />
        <Loader2 size={22} className="animate-spin text-brand" />
        <Text className="text-xs text-muted">
          Menyiapkan ruang {committee ? 'panitia' : 'peserta'}…
        </Text>
      </main>
    )
  if (!data)
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-6 px-6">
        <Wordmark />
        <Alert tone="error">{error || 'Data tidak tersedia.'}</Alert>
        <Button
          onClick={() => {
            setError('')
            refresh().catch((e) => setError((e as Error).message))
          }}
        >
          Coba lagi
        </Button>
        <AppLink href="/" className="text-center text-sm text-brand">
          Kembali masuk
        </AppLink>
      </main>
    )

  const resetModal = (
    <Modal open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset data dummy?">
      <Text className="text-sm leading-7 text-muted">
        Seluruh perubahan pendaftaran, unggahan berkas, verifikasi, jadwal, dan tema di browser
        akan dikembalikan ke data dummy awal.
      </Text>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setConfirmReset(false)}>
          Batal
        </Button>
        <Button variant="danger" onClick={() => void handleReset()}>
          Ya, reset data
        </Button>
      </div>
    </Modal>
  )

  const helpModal = (
    <Modal open={help} onClose={() => setHelp(false)} title="Pusat bantuan MOKA">
      <Text className="text-sm leading-8 text-muted">
        Buka MOKA Assistant di kanan bawah untuk pertanyaan tentang persyaratan, template CV,
        unggahan dokumen, dan jadwal. Pada versi frontend React + TypeScript ini, seluruh data
        berjalan memakai data dummy lokal di browser tanpa backend server maupun database.
      </Text>
      <Alert className="mt-5 !text-xs">
        Gunakan pemilih peran (Peserta ↔ Panitia), pemilih skenario peserta, serta tombol Reset Data
        untuk menguji seluruh alur pendaftaran dan seleksi.
      </Alert>
    </Modal>
  )

  const logoutModal = (
    <Modal open={logout} onClose={() => setLogout(false)} title="Keluar dari MOKA?">
      <Text className="text-sm leading-7 text-muted">
        Anda akan kembali ke halaman masuk portal MOKA. Perubahan dummy di browser tetap tersimpan
        kecuali di-reset.
      </Text>
      <div className="mt-6 flex justify-end gap-3">
        <Button variant="secondary" onClick={() => setLogout(false)}>
          Tetap di sini
        </Button>
        <Button
          busy={loggingOut}
          onClick={async () => {
            setLoggingOut(true)
            try {
              await mokaApi('logout', {})
              navigateRouter('/')
            } catch (e) {
              setError((e as Error).message)
              setLogout(false)
            } finally {
              setLoggingOut(false)
            }
          }}
        >
          Ya, keluar
        </Button>
      </div>
    </Modal>
  )

  const toastBanner = toast && (
    <div
      role="status"
      className="fixed left-1/2 top-5 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-success/25 bg-paper px-5 py-4 text-xs leading-6 text-success shadow-lg"
    >
      <CheckCircle2 size={18} className="shrink-0" />
      <span className="flex-1">{toast}</span>
      <Button
        variant="ghost"
        className="!min-h-5 !p-0 !text-muted"
        aria-label="Tutup notifikasi"
        onClick={() => setToast('')}
      >
        <X size={14} />
      </Button>
    </div>
  )

  if (isOnboarding)
    return (
      <div className="min-h-dvh bg-canvas">
        <header className="sticky top-0 z-30 border-b border-line bg-cocoa text-champagne">
          <div className="mx-auto flex h-18 max-w-6xl items-center justify-between gap-4 px-5 sm:px-9">
            <div className="flex items-center gap-4">
              <Wordmark dark compact />
              <span className="hidden h-5 w-px bg-champagne/15 sm:block" />
              <div className="hidden sm:block">
                <Text className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gold-light">
                  Alur Pendaftaran Peserta
                </Text>
                <Text className="mt-0.5 text-[11px] text-champagne/80">
                  Selesaikan 3 langkah berikut sebelum masuk ke dashboard peserta
                </Text>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                variant="ghost"
                className="!min-h-9 !rounded-lg !border !border-champagne/15 !px-3 !py-1.5 !text-xs !text-gold-light hover:!bg-champagne/10"
                onClick={() => switchRole(true)}
              >
                <ArrowLeftRight size={14} />
                <span className="hidden sm:inline">Mode Panitia</span>
              </Button>
              <Button
                variant="ghost"
                className="!min-h-9 !rounded-lg !border !border-champagne/15 !px-3 !py-1.5 !text-xs !text-champagne hover:!bg-champagne/10"
                onClick={() => setHelp(true)}
              >
                Pusat bantuan
              </Button>
            </div>
          </div>
          <div className="border-t border-champagne/10 bg-umber/75">
            <div className="mx-auto max-w-6xl px-5 py-3.5 sm:px-9">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-champagne/15 bg-cocoa/55 px-3.5 py-2 text-xs">
                <span className="text-[11px] text-champagne/85">
                  Skenario aktif: <strong className="text-ivory">{data.user.name}</strong> (Draft)
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Pilih skenario peserta"
                    value={data.user.id}
                    onChange={(e) => void handleScenarioChange(e.target.value)}
                    className="rounded-md border border-champagne/25 bg-cocoa px-2.5 py-1 text-[11px] text-ivory outline-none focus:border-gold"
                  >
                    {participantOptions.scenarios.map((item) => (
                      <option key={item.id} value={item.userId}>
                        {item.shortLabel}
                      </option>
                    ))}
                    {participantOptions.customUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Baru)
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    className="!min-h-7 !border !border-champagne/20 !px-2.5 !py-1 !text-[11px] !text-champagne hover:!bg-champagne/10"
                    onClick={() => setConfirmReset(true)}
                  >
                    <RotateCcw size={12} />
                    Reset
                  </Button>
                </div>
              </div>
              <ol className="grid gap-2.5 sm:grid-cols-3" aria-label="Tahapan pendaftaran">
                {wizardSteps.map((item, index) => {
                  const active = wizardStep === item.key
                  const done =
                    index < activeWizardIndex ||
                    (item.key === 'form' && Boolean(app?.category && app?.fullName)) ||
                    (item.key === 'documents' && requiredDocCount === requiredDocumentCount)
                  const canOpen =
                    item.key === 'form' ||
                    Boolean(app) ||
                    Boolean(profile.category && profile.fullName)
                  return (
                    <li key={item.key}>
                      <Button
                        variant="ghost"
                        disabled={!canOpen}
                        onClick={() => {
                          setWizardStep(item.key)
                          setError('')
                          window.scrollTo({ top: 0, behavior: 'smooth' })
                        }}
                        className={`w-full !min-h-13 !justify-start !gap-3.5 !rounded-xl !border !px-4 !py-2.5 !text-left ${
                          active
                            ? '!border-gold !bg-champagne/12 !text-ivory'
                            : done
                              ? '!border-champagne/20 !bg-champagne/5 !text-champagne'
                              : '!border-champagne/10 !bg-transparent !text-champagne/80'
                        }`}
                      >
                        <span
                          className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                            active
                              ? 'bg-gold text-cocoa'
                              : done
                                ? 'bg-success text-ivory'
                                : 'border border-champagne/25 text-champagne/80'
                          }`}
                        >
                          {done && !active ? <Check size={14} /> : item.step}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-semibold">{item.label}</span>
                          <span className="mt-0.5 block truncate text-[10px] font-normal text-champagne/80">
                            {item.desc}
                          </span>
                        </span>
                      </Button>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-5 pb-32 pt-8 sm:px-9 sm:pt-10">
          {error && (
            <Alert tone="error" className="mb-5">
              {error}
            </Alert>
          )}
          <ParticipantViews
            data={data}
            page={wizardStep}
            navigate={(next) => {
              if (next === 'form' || next === 'documents' || next === 'preview') {
                setWizardStep(next)
              } else {
                setPage('dashboard')
              }
              window.scrollTo({ top: 0, behavior: 'smooth' })
              document.getElementById('root')?.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            refresh={refresh}
            notify={setToast}
            profile={profile}
            setProfile={setProfile}
            onboarding
          />
        </main>
        <footer className="mx-auto flex max-w-6xl flex-wrap justify-between gap-3 border-t border-line px-6 pb-24 pt-5 text-[9px] text-muted sm:px-9 sm:pb-7">
          <Text>© {eventYear} MOKA Kabupaten Bogor · Alur Pendaftaran Peserta</Text>
          <Text>Selesaikan pendaftaran untuk membuka dashboard peserta.</Text>
        </footer>
        <Assistant />
        {toastBanner}
        {resetModal}
        {helpModal}
      </div>
    )

  return (
    <div className="min-h-dvh bg-canvas">
      {drawer && (
        <div
          className="fixed inset-0 z-40 bg-cocoa/50 lg:hidden"
          onClick={() => setDrawer(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-champagne/10 bg-cocoa text-champagne transition-transform lg:translate-x-0 ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-6 pb-6 pt-7">
          <Wordmark dark compact />
          <Button
            variant="ghost"
            className="!min-h-8 !p-1 !text-champagne lg:!hidden"
            aria-label="Tutup navigasi"
            onClick={() => setDrawer(false)}
          >
            <X size={19} />
          </Button>
        </div>
        <Text className="mb-3 px-7 text-[9px] uppercase tracking-[0.17em] text-champagne/80">
          {committee ? 'Kelola seleksi' : 'Perjalananmu'}
        </Text>
        <nav aria-label="Navigasi utama" className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3">
          {menu.map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              onClick={() => navigate(item.key)}
              className={`w-full !min-h-10 !justify-start !gap-3 !rounded-md !px-4 !py-2.5 !text-[11px] !font-normal ${page === item.key ? '!bg-champagne/10 !font-medium !text-ivory' : '!text-champagne/80 hover:!bg-champagne/5 hover:!text-ivory'}`}
              aria-current={page === item.key ? 'page' : undefined}
            >
              <item.icon size={17} strokeWidth={1.5} />
              {item.label}
              {page === item.key && <span className="ml-auto size-1 rounded-full bg-gold" />}
            </Button>
          ))}
        </nav>
        <div className="mt-auto shrink-0 px-5 pb-6 pt-4">
          <div className="mb-4 rounded-xl border border-champagne/15 bg-umber/55 p-3">
            <Text className="mb-2 text-[9px] font-semibold uppercase tracking-[0.15em] text-gold-light">
              Mode Simulasi Frontend
            </Text>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => switchRole(false)}
                className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${!committee ? 'bg-champagne text-cocoa' : 'text-champagne/80 hover:bg-champagne/10'}`}
              >
                Peserta
              </button>
              <button
                type="button"
                onClick={() => switchRole(true)}
                className={`rounded-md px-2 py-1.5 text-[11px] font-medium transition-colors ${committee ? 'bg-champagne text-cocoa' : 'text-champagne/80 hover:bg-champagne/10'}`}
              >
                Panitia
              </button>
            </div>
            {!committee && (
              <div className="mt-2.5">
                <label className="mb-1 block text-[9px] uppercase tracking-wider text-champagne/70">
                  Skenario peserta
                  <Select
                    aria-label="Pilih skenario peserta"
                    value={data.user.id}
                    onChange={(e) => void handleScenarioChange(e.target.value)}
                    className="mt-1 !min-h-8 !border-champagne/20 !bg-cocoa !px-2.5 !py-1 !text-[11px] !text-ivory"
                  >
                    {participantOptions.scenarios.map((item) => (
                      <option key={item.id} value={item.userId}>
                        {item.shortLabel}
                      </option>
                    ))}
                    {participantOptions.customUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} (Baru)
                      </option>
                    ))}
                  </Select>
                </label>
              </div>
            )}
            <Button
              variant="ghost"
              onClick={() => setConfirmReset(true)}
              className="mt-2 w-full !min-h-8 !justify-center !gap-1.5 !border !border-champagne/15 !px-2 !py-1.5 !text-[10px] !font-normal !text-champagne/85 hover:!bg-champagne/10"
            >
              <RotateCcw size={12} />
              Reset data dummy
            </Button>
          </div>
          <Button
            variant="ghost"
            className="mb-4 w-full !min-h-10 !justify-between !rounded-lg !border !border-champagne/12 !px-3.5 !py-2.5 !text-[11px] !font-medium !text-gold-light hover:!border-champagne/25 hover:!bg-champagne/5"
            onClick={() => setHelp(true)}
          >
            <span>Pusat bantuan</span>
            <ChevronRight size={14} />
          </Button>
          <div className="flex items-center gap-3 border-t border-champagne/12 pt-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-champagne/10 font-serif text-lg">
              {data.user.name.slice(0, 1)}
            </span>
            <div className="min-w-0 flex-1">
              <Text className="truncate text-[11px] text-ivory">{data.user.name}</Text>
              <Text className="mt-1 text-[9px] text-champagne/80">
                {committee ? 'Panitia MOKA' : 'Peserta MOKA'}
              </Text>
            </div>
            <Button
              variant="ghost"
              className="!min-h-8 !p-1 !text-champagne/80"
              aria-label="Keluar dari akun"
              onClick={() => setLogout(true)}
            >
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </aside>
      <div className="lg:ml-64">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-line bg-paper/95 px-5 backdrop-blur-sm sm:px-9">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              className="!min-h-8 !p-1 lg:!hidden"
              aria-label="Buka navigasi"
              onClick={() => setDrawer(true)}
            >
              <Menu size={21} />
            </Button>
            <Text className="hidden text-[10px] text-muted sm:block">MOKA</Text>
            <ChevronRight size={12} className="hidden text-muted/50 sm:block" />
            <Text className="text-xs font-medium">{currentLabel}</Text>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button
              variant="secondary"
              onClick={() => switchRole(!committee)}
              className="hidden !min-h-8 !gap-1.5 !px-3 !py-1.5 !text-[11px] sm:inline-flex"
            >
              <ArrowLeftRight size={13} />
              {committee ? 'Lihat sisi Peserta' : 'Buka Ruang Panitia'}
            </Button>
            <Text className="hidden text-[10px] text-muted md:block">
              Mojang Jajaka Kabupaten Bogor
            </Text>
            <span className="h-5 w-px bg-line" />
            <Button
              variant="ghost"
              aria-label="Profil saya"
              onClick={() => !committee && navigate('profile')}
              className="!size-8 !min-h-8 !rounded-full !bg-brand/7 !p-0 !text-[11px] !font-semibold !text-brand"
            >
              {data.user.name.slice(0, 1)}
            </Button>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-5 pb-32 pt-8 sm:px-9 sm:pt-10 xl:px-12">
          {error && (
            <Alert tone="error" className="mb-5">
              {error}
            </Alert>
          )}
          {committee ? (
            <CommitteeViews
              data={data}
              page={page}
              navigate={navigate}
              refresh={refresh}
              notify={setToast}
            />
          ) : (
            <ParticipantViews
              data={data}
              page={page}
              navigate={navigate}
              refresh={refresh}
              notify={setToast}
              profile={profile}
              setProfile={setProfile}
            />
          )}
        </main>
        <footer className="flex flex-wrap justify-between gap-3 border-t border-line px-6 pb-24 pt-5 text-[9px] text-muted sm:px-9 sm:pb-7">
          <Text>© {eventYear} MOKA Kabupaten Bogor</Text>
          <Text>Berakar pada budaya. Berdaya untuk Bogor.</Text>
        </footer>
      </div>
      <Assistant />
      {toastBanner}
      {logoutModal}
      {resetModal}
      {helpModal}
    </div>
  )
}

export default function Workspace({ committee = false }: { committee?: boolean }) {
  return <WorkspaceContent key={committee ? 'committee' : 'participant'} committee={committee} />
}
