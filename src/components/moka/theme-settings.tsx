import { useEffect, useRef, useState } from 'react'
import { Check, Eye, ImagePlus, Palette, RotateCcw, Upload } from 'lucide-react'
import { DEFAULT_THEME, THEME_PRESETS, applyThemeToDocument, resolveTheme } from '@/lib/theme'
import { mokaApi, processBrandingImage } from '@/services/moka-mock-service'
import type { ThemePreferences } from '@/types/moka'
import { Alert, Button, Field, Input, Panel, Text, Textarea } from './ui'
import type { SharedProps } from './types'

function ThemeSettingsForm({
  data,
  refresh,
  notify,
}: Pick<SharedProps, 'data' | 'refresh' | 'notify'>) {
  const savedTheme = resolveTheme(data.settings.theme)
  const [draft, setDraft] = useState<ThemePreferences>(savedTheme)
  const [registrationNote, setRegistrationNote] = useState(data.settings.registrationNote || '')
  const [busy, setBusy] = useState(false)
  const [uploadingKind, setUploadingKind] = useState<'logo' | 'cover' | null>(null)
  const [error, setError] = useState('')
  const savedThemeRef = useRef(savedTheme)

  useEffect(() => {
    savedThemeRef.current = savedTheme
  }, [savedTheme])

  useEffect(() => {
    return () => {
      applyThemeToDocument(savedThemeRef.current)
    }
  }, [])

  const applyDraft = (patch: Partial<ThemePreferences>) => {
    const next = resolveTheme({ ...draft, ...patch })
    setDraft(next)
    applyThemeToDocument(next)
  }

  const handleImageUpload = async (kind: 'logo' | 'cover', file?: File) => {
    if (!file) return
    setUploadingKind(kind)
    setError('')
    try {
      const dataUrl = await processBrandingImage(file, kind)
      applyDraft(kind === 'logo' ? { logoUrl: dataUrl } : { coverUrl: dataUrl })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setUploadingKind(null)
    }
  }

  const save = async () => {
    setBusy(true)
    setError('')
    try {
      await mokaApi(
        'theme-settings',
        {
          ...draft,
          registrationNote,
        },
        'committee',
      )
      savedThemeRef.current = draft
      await refresh()
      notify('Pengaturan tema, logo, dan gambar cover berhasil disimpan.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const resetAll = async () => {
    setBusy(true)
    setError('')
    try {
      const res = await mokaApi('theme-reset', {}, 'committee')
      const freshTheme = resolveTheme(res.settings?.theme || DEFAULT_THEME)
      savedThemeRef.current = freshTheme
      setDraft(freshTheme)
      setRegistrationNote(res.settings?.registrationNote || '')
      applyThemeToDocument(freshTheme)
      await refresh()
      notify('Tema, logo, dan gambar cover dikembalikan ke pengaturan bawaan.')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const colorFields: Array<{
    key: 'brand' | 'cocoa' | 'canvas' | 'paper' | 'accent'
    label: string
    desc: string
  }> = [
    { key: 'brand', label: 'Warna utama', desc: 'Tombol utama, tautan aktif, aksen merek' },
    { key: 'cocoa', label: 'Warna gelap / sidebar', desc: 'Sidebar navigasi, panel hero, teks utama' },
    { key: 'canvas', label: 'Latar halaman', desc: 'Warna dasar area kerja' },
    { key: 'paper', label: 'Permukaan card', desc: 'Latar panel, kartu, dan formulir' },
    { key: 'accent', label: 'Aksen & garis batas', desc: 'Garis tepi panel dan detail dekoratif' },
  ]

  return (
    <div className="space-y-6">
      <Panel>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Text as="h2" className="flex items-center gap-2 font-serif text-xl">
              <Eye size={19} className="text-brand" />
              Pratinjau langsung tampilan
            </Text>
            <Text className="mt-1.5 text-xs text-muted">
              Perubahan warna, logo, dan cover langsung terlihat di antarmuka. Klik simpan agar
              tetap berlaku di seluruh sesi.
            </Text>
          </div>
          <Button variant="secondary" disabled={busy} onClick={() => void resetAll()}>
            <RotateCcw size={15} />
            Kembalikan bawaan
          </Button>
        </div>

        <div className="grid gap-4 overflow-hidden rounded-xl border border-line bg-canvas p-4 md:grid-cols-2">
          <div className="relative h-56 overflow-hidden rounded-xl border border-line bg-cocoa">
            <img
              src={draft.coverUrl}
              alt="Pratinjau gambar cover utuh halaman login dan register"
              className="h-full w-full object-contain object-center"
            />
          </div>

          <div
            className="flex flex-col justify-between rounded-xl border p-5"
            style={{
              backgroundColor: draft.paper,
              borderColor: draft.accent,
              color: draft.cocoa,
            }}
          >
            <div>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={draft.logoUrl}
                    alt="Pratinjau logo"
                    className="size-8 rounded object-contain"
                  />
                  <span className="font-serif text-xl tracking-[0.12em]">
                    MOKA<span style={{ color: draft.accent }}>.</span>
                  </span>
                </div>
                <span
                  className="border px-2 py-0.5 text-[10px] tracking-[0.15em]"
                  style={{ borderColor: draft.accent, color: draft.cocoa }}
                >
                  {draft.eventYear}
                </span>
              </div>
              <h3 className="mt-4 font-serif text-xl">Portal Pendaftaran MOKA</h3>
              <p className="mt-2 text-xs leading-relaxed opacity-80">
                {registrationNote || 'Catatan periode pendaftaran tampil pada ringkasan peserta.'}
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span
                className="inline-flex items-center rounded-lg px-4 py-2 text-xs font-semibold"
                style={{ backgroundColor: draft.brand, color: draft.canvas }}
              >
                Tombol Utama
              </span>
              <span
                className="inline-flex items-center rounded-lg border px-4 py-2 text-xs font-semibold"
                style={{ borderColor: draft.accent, color: draft.cocoa }}
              >
                Tombol Sekunder
              </span>
            </div>
          </div>
        </div>
      </Panel>

      <Panel>
        <Text as="h2" className="flex items-center gap-2 font-serif text-xl">
          <Palette size={19} className="text-brand" />
          Preset tema & kustomisasi warna
        </Text>
        <Text className="mt-2 text-xs leading-6 text-muted">
          Pilih salah satu palet kurasi atau sesuaikan masing-masing komponen warna sesuai identitas
          acara tahun berjalan.
        </Text>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {THEME_PRESETS.map((preset) => {
            const active =
              draft.presetId === preset.id &&
              draft.brand === preset.brand &&
              draft.cocoa === preset.cocoa
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() =>
                  applyDraft({
                    presetId: preset.id,
                    brand: preset.brand,
                    cocoa: preset.cocoa,
                    canvas: preset.canvas,
                    paper: preset.paper,
                    accent: preset.accent,
                  })
                }
                className={`flex flex-col rounded-xl border p-4 text-left transition-colors ${active ? 'border-brand bg-brand/5' : 'border-line bg-paper hover:border-brand/50'}`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex -space-x-1">
                    {[preset.cocoa, preset.brand, preset.accent, preset.canvas].map((hex) => (
                      <span
                        key={hex}
                        className="size-5 rounded-full border border-white shadow-xs"
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                  {active && <Check size={15} className="text-brand" />}
                </div>
                <Text className="text-xs font-semibold text-ink">{preset.name}</Text>
                <Text className="mt-1 text-[11px] leading-5 text-muted">{preset.description}</Text>
              </button>
            )
          })}
        </div>

        <div className="mt-6 grid gap-4 border-t border-line pt-6 sm:grid-cols-2 lg:grid-cols-3">
          {colorFields.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-3 rounded-xl border border-line bg-canvas/35 p-3.5"
            >
              <div className="min-w-0">
                <Text className="text-xs font-semibold">{item.label}</Text>
                <Text className="mt-0.5 text-[10px] leading-4 text-muted">{item.desc}</Text>
                <Text className="mt-1 font-mono text-[10px] uppercase text-muted">
                  {draft[item.key]}
                </Text>
              </div>
              <input
                type="color"
                aria-label={item.label}
                value={draft[item.key]}
                onChange={(e) =>
                  applyDraft({
                    presetId: 'custom',
                    [item.key]: e.target.value,
                  })
                }
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-line bg-paper p-1"
              />
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel>
          <Text as="h2" className="flex items-center gap-2 font-serif text-xl">
            <Upload size={18} className="text-brand" />
            Logo aplikasi dinamis
          </Text>
          <Text className="mt-2 text-xs leading-6 text-muted">
            Ditampilkan di sidebar, header registrasi, halaman masuk, serta ikon tab browser. Format
            PNG, JPG, WebP, atau SVG.
          </Text>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="flex size-20 items-center justify-center rounded-xl border border-line bg-cocoa p-3">
              <img
                src={draft.logoUrl}
                alt="Logo pada latar gelap"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="flex size-20 items-center justify-center rounded-xl border border-line bg-paper p-3">
              <img
                src={draft.logoUrl}
                alt="Logo pada latar terang"
                className="max-h-full max-w-full object-contain"
              />
            </div>
            <div className="min-w-44 flex-1 space-y-2.5">
              <Input
                type="file"
                aria-label="Unggah logo baru"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                disabled={uploadingKind !== null}
                onChange={(e) => {
                  void handleImageUpload('logo', e.target.files?.[0])
                  e.target.value = ''
                }}
                className="!min-h-0 !border-0 !bg-transparent !p-0 !text-xs file:mr-3 file:rounded-md file:border file:border-line file:bg-canvas file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink"
              />
              {draft.logoUrl !== DEFAULT_THEME.logoUrl && (
                <Button
                  variant="ghost"
                  className="!min-h-7 !px-0 !text-xs"
                  onClick={() => applyDraft({ logoUrl: DEFAULT_THEME.logoUrl })}
                >
                  Kembalikan logo bawaan
                </Button>
              )}
            </div>
          </div>
        </Panel>

        <Panel>
          <Text as="h2" className="flex items-center gap-2 font-serif text-xl">
            <ImagePlus size={18} className="text-brand" />
            Gambar cover halaman login & register
          </Text>
          <Text className="mt-2 text-xs leading-6 text-muted">
            Ditampilkan sebagai satu gambar utuh pada panel kiri halaman masuk dan pendaftaran
            peserta tanpa filter atau teks tambahan. Format JPG, PNG, atau WebP.
          </Text>
          <div className="mt-5 space-y-4">
            <div className="relative h-36 overflow-hidden rounded-xl border border-line bg-cocoa">
              <img
                src={draft.coverUrl}
                alt="Pratinjau gambar cover"
                className="h-full w-full object-contain object-center"
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Input
                type="file"
                aria-label="Unggah gambar cover baru"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingKind !== null}
                onChange={(e) => {
                  void handleImageUpload('cover', e.target.files?.[0])
                  e.target.value = ''
                }}
                className="!min-h-0 flex-1 !border-0 !bg-transparent !p-0 !text-xs file:mr-3 file:rounded-md file:border file:border-line file:bg-canvas file:px-3 file:py-2 file:text-xs file:font-medium file:text-ink"
              />
              {draft.coverUrl !== DEFAULT_THEME.coverUrl && (
                <Button
                  variant="ghost"
                  className="!min-h-7 !px-0 !text-xs"
                  onClick={() => applyDraft({ coverUrl: DEFAULT_THEME.coverUrl })}
                >
                  Kembalikan cover bawaan
                </Button>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <Panel>
        <Text as="h2" className="mb-5 font-serif text-xl">
          Identitas & catatan periode
        </Text>
        <div className="grid gap-5 md:grid-cols-[180px_1fr]">
          <Field label="Tahun penyelenggaraan">
            <Input
              value={draft.eventYear}
              maxLength={16}
              placeholder="2026"
              onChange={(e) => applyDraft({ eventYear: e.target.value })}
            />
          </Field>
          <Field label="Catatan periode pendaftaran (tampil di dashboard peserta)">
            <Textarea
              className="!min-h-20"
              value={registrationNote}
              maxLength={500}
              placeholder="Contoh: Periode Pendaftaran MOKA Kabupaten Bogor 2026."
              onChange={(e) => setRegistrationNote(e.target.value)}
            />
          </Field>
        </div>
        {error && (
          <Alert tone="error" className="mt-5">
            {error}
          </Alert>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" disabled={busy} onClick={() => void resetAll()}>
            Reset ke bawaan
          </Button>
          <Button busy={busy} disabled={uploadingKind !== null} onClick={() => void save()}>
            Simpan pengaturan tema
          </Button>
        </div>
      </Panel>
    </div>
  )
}

export default function ThemeSettings(props: Pick<SharedProps, 'data' | 'refresh' | 'notify'>) {
  const settingsKey = `${props.data.settings.updatedAt ?? ''}|${props.data.settings.theme?.presetId ?? ''}`
  return <ThemeSettingsForm key={settingsKey} {...props} />
}
