import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react'
import { registrationIsClosed } from '@/lib/moka-policy'
import { applyThemeToDocument, resolveTheme } from '@/lib/theme'
import { getCurrentSettings, mokaApi } from '@/services/moka-mock-service'
import { dateLabel } from './types'
import { Alert, AppLink, Button, Checkbox, Field, Input, Modal, Text } from './ui'
import Assistant from './assistant'

export default function AuthPage({ register = false }: { register?: boolean }) {
  const navigate = useNavigate()
  const [settings] = useState(() => getCurrentSettings())
  const resolvedTheme = resolveTheme(settings.theme)
  const eventYear = resolvedTheme.eventYear || settings.eventYear || '2026'
  const regClosed = register && registrationIsClosed(settings)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [remember, setRemember] = useState(false)
  const [consent, setConsent] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')

  useEffect(() => {
    applyThemeToDocument(settings.theme)
  }, [settings.theme])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (regClosed) return
    setError('')
    const data = Object.fromEntries(new FormData(event.currentTarget))
    setBusy(true)
    try {
      const { user } = await mokaApi(register ? 'signup' : 'login', { ...data, remember })
      navigate(user.role === 'committee' ? '/panitia' : '/peserta')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main
      className={`auth-layout grid min-h-dvh bg-paper lg:grid-cols-[auto_1fr] ${register ? 'auth-register' : 'auth-login'}`}
    >
      <aside className="auth-cover relative hidden overflow-hidden bg-cocoa lg:flex lg:items-center lg:justify-center">
        <img
          src={resolvedTheme.coverUrl}
          alt="Cover Portal Pendaftaran MOKA Kabupaten Bogor"
          className="block h-full w-auto max-w-full object-contain"
        />
      </aside>
      <section className="auth-form-side relative flex min-h-dvh flex-col px-7 py-9 sm:px-14 lg:px-[12%] lg:py-12">
        <header className="flex shrink-0 items-center justify-end gap-4">
          <AppLink
            href={register ? '/' : '/daftar'}
            className="flex items-center gap-2 text-[11px] font-medium text-muted hover:text-brand"
          >
            {register ? 'Kembali masuk' : 'Belum punya akun?'}
            <ArrowRight size={13} />
          </AppLink>
        </header>
        <div
          className={`auth-form-content my-auto mx-auto flex w-full max-w-[408px] shrink-0 flex-col ${register ? 'py-10' : 'py-16'}`}
        >
          <Text className="auth-form-eyebrow mb-3 text-[10px] font-semibold tracking-[0.19em] text-brand">
            {register ? 'MULAI PERJALANANMU' : 'SELAMAT DATANG KEMBALI'}
          </Text>
          <Text
            as="h2"
            className="auth-form-title font-serif text-[clamp(32px,3.05vw,46px)] leading-tight tracking-[-0.045em] text-cocoa"
          >
            {register ? 'Ruang untuk potensimu.' : 'Wilujeng sumping.'}
          </Text>
          <Text className="auth-form-intro mt-4 text-[12px] leading-[1.9] text-muted">
            {register
              ? 'Buat akun peserta dan awali perjalananmu sebagai bagian dari Mojang Jajaka Kabupaten Bogor.'
              : 'Masuk untuk melanjutkan perjalananmu bersama Mojang Jajaka Kabupaten Bogor.'}
          </Text>
          {regClosed && (
            <Alert tone="error" className="mt-6 !text-xs">
              Batas akhir pendaftaran telah berakhir pada{' '}
              <strong>{dateLabel(settings.registrationDeadline, true)}</strong>. Pendaftaran akun
              peserta baru sudah ditutup oleh panitia.
            </Alert>
          )}
          <form className="auth-form mt-8 grid gap-5" onSubmit={submit} noValidate>
            {error && (
              <Alert tone="error" className={register ? 'lg:col-span-2' : ''}>
                {error}
              </Alert>
            )}
            <fieldset disabled={regClosed} className="contents">
              {register && (
                <Field label="Nama lengkap">
                  <span className="relative">
                    <UserRound
                      size={17}
                      className="pointer-events-none absolute left-4 top-4 text-muted"
                    />
                    <Input
                      name="name"
                      autoComplete="name"
                      placeholder="Sesuai identitas (opsional di demo)"
                      maxLength={150}
                      className="!pl-11"
                    />
                  </span>
                </Field>
              )}
              <Field label="Alamat email">
                <span className="relative">
                  <Mail
                    size={17}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-4 top-4 text-muted"
                  />
                  <Input
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@email.com (atau panitia@...)"
                    className="!pl-11"
                  />
                </span>
              </Field>
              <Field label="Kata sandi">
                <span className="relative">
                  <LockKeyhole
                    size={16}
                    strokeWidth={1.5}
                    className="pointer-events-none absolute left-4 top-4 text-muted"
                  />
                  <Input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={register ? 'Buat kata sandi' : 'Bebas / lewati di mode demo'}
                    autoComplete={register ? 'new-password' : 'current-password'}
                    maxLength={200}
                    className="!px-11"
                  />
                  <Button
                    variant="ghost"
                    className="auth-password-toggle absolute right-2 top-2 !size-9 !min-h-9 !p-0 !text-muted"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </Button>
                </span>
              </Field>
              {register && (
                <Field label="Konfirmasi kata sandi">
                  <span className="relative">
                    <LockKeyhole
                      size={16}
                      strokeWidth={1.5}
                      className="pointer-events-none absolute left-4 top-4 text-muted"
                    />
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi"
                      className="!px-11"
                    />
                    <Button
                      variant="ghost"
                      className="auth-password-toggle absolute right-2 top-2 !size-9 !min-h-9 !p-0 !text-muted"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      aria-label={
                        showConfirmPassword
                          ? 'Sembunyikan konfirmasi kata sandi'
                          : 'Tampilkan konfirmasi kata sandi'
                      }
                    >
                      {showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </Button>
                  </span>
                </Field>
              )}
              {register ? (
                <div className="lg:col-span-2 [&>label]:text-xs [&>label]:leading-5">
                  <Checkbox checked={consent} onChange={setConsent} disabled={regClosed}>
                    Saya menyetujui penggunaan data simulasi untuk proses pendaftaran MOKA.{' '}
                    <Button
                      variant="ghost"
                      className="!min-h-0 !p-0 !text-xs"
                      onClick={() => setInfo('privacy')}
                    >
                      Informasi privasi
                    </Button>
                  </Checkbox>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 pt-0.5">
                  <Checkbox checked={remember} onChange={setRemember}>
                    <span className="text-[11px]">Ingat saya</span>
                  </Checkbox>
                  <Button
                    variant="ghost"
                    className="!min-h-0 !p-0 !text-[11px] !font-medium"
                    onClick={() => setInfo('password')}
                  >
                    Lupa kata sandi?
                  </Button>
                </div>
              )}
              <Button
                type="submit"
                busy={busy}
                disabled={regClosed}
                className={`auth-submit mt-1 w-full !justify-between !rounded-lg !py-3 !text-[12px] ${register ? 'lg:col-span-2' : ''}`}
              >
                <span>
                  {regClosed
                    ? 'Pendaftaran sudah ditutup'
                    : register
                      ? 'Buat akun & masuk wizard'
                      : 'Masuk ke MOKA'}
                </span>
                <ArrowRight size={17} strokeWidth={1.5} />
              </Button>
            </fieldset>
          </form>
          <div className="auth-form-divider my-7 flex items-center gap-4">
            <span className="h-px flex-1 bg-line" />
            <Text className="text-[10px] text-muted">
              {register ? 'sudah punya akun?' : 'baru di MOKA?'}
            </Text>
            <span className="h-px flex-1 bg-line" />
          </div>
          <AppLink
            href={register ? '/' : '/daftar'}
            className="auth-alternate-link flex min-h-12 items-center justify-center gap-2 rounded-lg border border-line bg-paper py-3 text-xs font-semibold text-brand hover:border-brand/40 hover:bg-canvas"
          >
            {register ? 'Masuk ke akunmu' : 'Daftar sebagai peserta'}
            <ArrowRight size={15} />
          </AppLink>
          {!register && (
            <div className="auth-access-note mt-5 flex items-start justify-center gap-2 text-muted">
              <ShieldCheck size={14} strokeWidth={1.5} className="mt-0.5 shrink-0" />
              <Text className="max-w-72 text-center text-[10px] leading-[1.8]">
                Mode frontend-only: verifikasi login dilewati, data dummy tersimpan lokal di
                browser.
              </Text>
            </div>
          )}
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 pt-4 pb-8 text-[9px] text-muted lg:min-h-14 lg:items-end lg:pb-0 lg:pr-52">
          <Text>© {eventYear} MOKA Kabupaten Bogor</Text>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              className="!min-h-0 !p-0 !text-[9px] !font-normal !text-muted"
              onClick={() => setInfo('privacy')}
            >
              Privasi
            </Button>
            <span className="size-0.5 rounded-full bg-muted/40" />
            <Button
              variant="ghost"
              className="!min-h-0 !p-0 !text-[9px] !font-normal !text-muted"
              onClick={() => setInfo('help')}
            >
              Pusat bantuan
            </Button>
          </div>
        </footer>
      </section>
      <Assistant />
      <Modal
        open={!!info}
        onClose={() => setInfo('')}
        title={
          info === 'password'
            ? 'Pemulihan kata sandi'
            : info === 'privacy'
              ? 'Informasi privasi'
              : 'Pusat bantuan'
        }
      >
        <Text className="text-sm leading-7 text-muted">
          {info === 'password'
            ? 'Pada mode prototipe frontend ini verifikasi kata sandi dilewati. Anda dapat langsung menekan tombol Masuk ke MOKA dengan email apa saja (atau panitia@... untuk masuk sebagai panitia).'
            : info === 'privacy'
              ? 'Seluruh data dan berkas pada prototipe ini hanya disimpan sementara di browser Anda (localStorage) untuk keperluan simulasi frontend tanpa koneksi ke database server.'
              : 'Gunakan MOKA Assistant untuk panduan persyaratan, template, dan unggahan, atau masuk langsung menggunakan email peserta maupun panitia@... lalu berpindah peran lewat sidebar.'}
        </Text>
        <Button className="mt-6 w-full" onClick={() => setInfo('')}>
          Mengerti
        </Button>
      </Modal>
    </main>
  )
}
