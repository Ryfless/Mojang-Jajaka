import {
  useEffect,
  useRef,
  type AnchorHTMLAttributes,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, Check, CheckCircle2, Clock3, Loader2, X } from 'lucide-react'

export function Button({
  variant = 'primary',
  children,
  className = '',
  busy,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  busy?: boolean
}) {
  const styles = {
    primary: 'border-brand bg-brand text-ivory hover:bg-brand-dark',
    secondary: 'border-line bg-paper text-ink hover:border-brand hover:bg-canvas',
    ghost: 'border-transparent bg-transparent text-brand hover:bg-brand/5',
    danger: 'border-danger bg-danger text-ivory hover:opacity-90',
  }
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || busy}
      className={`inline-flex min-h-11 items-center justify-center gap-2.5 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    >
      {busy && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}

export function Text({
  as: Tag = 'p',
  children,
  className = '',
  id,
}: {
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Tag id={id} className={className}>
      {children}
    </Tag>
  )
}

export function AppLink({
  href,
  children,
  className = '',
  download,
  target,
  ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  href: string
  children: ReactNode
  className?: string
  download?: boolean | string
}) {
  const isNativeAnchor =
    Boolean(download) ||
    target === '_blank' ||
    /^(?:https?:|mailto:|tel:|blob:|data:|\/templates\/|\/images\/|\/samples\/)/.test(href)

  if (isNativeAnchor) {
    return (
      <a
        href={href}
        target={target}
        download={download}
        className={`transition-colors ${className}`}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <Link to={href} className={`transition-colors ${className}`} {...props}>
      {children}
    </Link>
  )
}

export function Input({ className = '', ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`min-h-12 w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted focus:border-brand focus:ring-3 focus:ring-brand/8 disabled:bg-canvas disabled:text-muted ${className}`}
    />
  )
}

export function Select({
  className = '',
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`min-h-12 w-full rounded-lg border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-brand focus:ring-3 focus:ring-brand/8 ${className}`}
    >
      {children}
    </select>
  )
}

export function Textarea({
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`min-h-28 w-full resize-y rounded-lg border border-line bg-paper px-4 py-3 text-sm leading-relaxed outline-none focus:border-brand focus:ring-3 focus:ring-brand/8 ${className}`}
    />
  )
}

export function Field({
  label,
  children,
  hint,
  required,
}: {
  label: string
  children: ReactNode
  hint?: string
  required?: boolean
}) {
  return (
    <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-ink">
      <span>
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs font-normal leading-relaxed text-muted">{hint}</span>}
    </label>
  )
}

export function Checkbox({
  checked,
  onChange,
  children,
  disabled = false,
  required = false,
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  children: ReactNode
  disabled?: boolean
  required?: boolean
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-muted">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
        required={required}
        className="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-line accent-brand"
      />
      <span>{children}</span>
    </label>
  )
}

export function RadioOption({
  name,
  value,
  checked,
  onChange,
  disabled,
  children,
}: {
  name: string
  value: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  children: ReactNode
}) {
  return (
    <label
      className={`flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border px-3 py-3 text-sm ${checked ? 'border-brand bg-brand/5 text-brand' : 'border-line text-ink'} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="size-4 shrink-0 accent-brand"
      />
      {children}
    </label>
  )
}

export function Badge({ status = 'draft', children }: { status?: string; children?: ReactNode }) {
  const good = ['accepted', 'received', 'published'].includes(status)
  const bad = ['rejected', 'cancelled'].includes(status)
  const pending = ['pending', 'uploaded'].includes(status)
  const Icon = good ? CheckCircle2 : bad ? AlertCircle : pending ? Clock3 : Clock3
  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${good ? 'bg-success/10 text-success' : bad ? 'bg-danger/9 text-danger' : pending ? 'bg-gold/12 text-gold-dark' : 'bg-muted/8 text-muted'}`}
    >
      <Icon size={12} />
      {children || status}
    </span>
  )
}

export function Alert({
  children,
  tone = 'info',
  className = '',
}: {
  children: ReactNode
  tone?: 'info' | 'error' | 'success'
  className?: string
}) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`flex gap-3 rounded-lg border p-4 text-sm leading-relaxed ${tone === 'error' ? 'border-danger/20 bg-danger/5 text-danger' : tone === 'success' ? 'border-success/20 bg-success/5 text-success' : 'border-gold/25 bg-gold/5 text-muted'} ${className}`}
    >
      {tone === 'success' ? (
        <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
      ) : (
        <AlertCircle size={18} className="mt-0.5 shrink-0" />
      )}
      <div>{children}</div>
    </div>
  )
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl border border-line bg-paper p-6 ${className}`}>
      {children}
    </section>
  )
}

export function Empty({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-5 py-14 text-center">
      <span className="mb-5 flex size-14 items-center justify-center rounded-full bg-canvas text-brand">
        {icon}
      </span>
      <Text as="h3" className="mb-2 font-serif text-xl">
        {title}
      </Text>
      <Text className="max-w-md text-sm leading-7 text-muted">{description}</Text>
      {children && <div className="mt-6">{children}</div>}
    </div>
  )
}

export function Modal({
  open,
  onClose,
  title,
  children,
  wide = false,
  headerActions,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
  headerActions?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (open && !dialog?.open) dialog?.showModal()
    if (!open && dialog?.open) dialog.close()
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-label={title}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      className={`m-auto max-h-[85dvh] w-[calc(100%-2rem)] rounded-2xl border border-line bg-paper p-0 text-ink shadow-2xl backdrop:bg-cocoa/55 ${wide ? 'max-w-3xl' : 'max-w-lg'}`}
    >
      <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-line bg-paper px-6 py-5">
        <Text as="h2" className="font-serif text-2xl">
          {title}
        </Text>
        <div className="flex items-center gap-2">
          {headerActions}
          <Button
            variant="ghost"
            className="!size-9 !min-h-9 !p-0"
            onClick={onClose}
            aria-label="Tutup"
          >
            <X size={20} />
          </Button>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  )
}

export function Stepper({ current = 0 }: { current?: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {['Akun', 'Data & berkas', 'Verifikasi', 'Pengumuman'].map((label, index) => (
        <li
          key={label}
          className={`flex flex-1 items-center gap-2 text-xs ${index <= current ? 'text-brand' : 'text-muted'}`}
        >
          <span
            className={`flex size-7 shrink-0 items-center justify-center rounded-full border ${index <= current ? 'border-brand bg-brand text-ivory' : 'border-line bg-paper'}`}
          >
            {index < current ? <Check size={14} /> : index + 1}
          </span>
          <span className="hidden sm:inline">{label}</span>
          {index < 3 && (
            <span className={`ml-1 h-px flex-1 ${index < current ? 'bg-brand/50' : 'bg-line'}`} />
          )}
        </li>
      ))}
    </ol>
  )
}

export function Wordmark({ dark = false, compact = false }: { dark?: boolean; compact?: boolean }) {
  return (
    <div className={`flex items-center gap-3.5 ${dark ? 'text-champagne' : 'text-cocoa'}`}>
      <span
        role="img"
        aria-label="Logo MOKA"
        className={`moka-logo-mark shrink-0 bg-contain bg-center bg-no-repeat ${compact ? 'size-9' : 'size-11'}`}
      />
      <span className={`${compact ? 'text-3xl' : 'text-4xl'} font-serif tracking-[0.12em]`}>
        MOKA<span className="text-gold">.</span>
      </span>
      {!compact && (
        <span
          className={`border-l pl-4 text-[10px] leading-[1.8] tracking-[0.12em] ${dark ? 'border-champagne/25 text-champagne/80' : 'border-line text-muted'}`}
        >
          MOJANG JAJAKA
          <br />
          KABUPATEN BOGOR
        </span>
      )}
    </div>
  )
}
