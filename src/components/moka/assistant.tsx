import { useEffect, useRef, useState, type FormEvent } from 'react'
import { ArrowUp, ChevronDown, MessageCircle, X } from 'lucide-react'
import { Button, Input, Text } from './ui'

const suggestions = [
  'Dokumen apa yang perlu disiapkan?',
  'Di mana mengunduh template CV & berkas?',
  'Bisakah berkas diubah setelah dikirim?',
  'Di mana melihat jadwal interview?',
]
const welcome =
  'Sampurasun! Saya MOKA Assistant. Ada yang bisa saya bantu seputar pendaftaran Mojang Jajaka Kabupaten Bogor?'

function answer(question: string) {
  const q = question.toLowerCase()
  if (/cv/.test(q) && /template|unduh|install/.test(q))
    return 'Anda dapat mengunduh Template CV pada langkah 02 Upload Dokumen (baik di bagian Template maupun langsung di dalam kartu Curriculum Vitae), mengisinya dengan riwayat Anda, lalu mengunggah kembali file CV sebelum mengirim pendaftaran.'
  if (/template|surat izin|unduh/.test(q))
    return 'Surat Izin Orang Tua dan Formulir Pendaftaran hanya perlu diunduh untuk referensi, sedangkan Template CV diunduh terlebih dahulu lalu diunggah kembali setelah diisi. Tautan contoh PDF dummy tersedia di langkah Upload Dokumen dan halaman Dokumen & Template.'
  if (/dokumen|berkas|unggah|upload|ubah|revisi/.test(q))
    return 'Unggah lima dokumen wajib: pas foto 4×6 berlatar putih, foto full body 4R, foto close-up 4R, bukti domisili KTP/KK/surat domisili, serta CV (unduh template CV terlebih dahulu bila belum punya). Pastikan seluruh data dan berkas sudah final karena setelah pendaftaran dikirim, peserta hanya dapat meninjau dokumen tanpa mengubahnya.'
  if (/status|verifikasi|lolos/.test(q))
    return 'Status pendaftaran (Menunggu verifikasi, Lolos administrasi, atau Tidak lolos) dapat dipantau melalui menu Status & Verifikasi dan Dashboard Peserta. Keputusan administrasi ditetapkan sepenuhnya oleh panitia.'
  if (/interview|wawancara|jadwal|batas|deadline|daftar/.test(q))
    return 'Jadwal interview terlihat oleh peserta berstatus Lolos administrasi setelah waktu pembukaan hasil seleksi tiba dan jadwal dipublikasikan oleh panitia. Perhatikan juga batas akhir pendaftaran pada halaman daftar maupun wizard peserta karena setelah melewati batas tersebut, pendaftaran baru dan pengiriman formulir otomatis terkunci.'
  if (/usia|tinggi|berat|syarat|kategori/.test(q))
    return 'Peserta berusia 17–24 tahun, berdomisili di Kabupaten Bogor, dan belum menikah. Tinggi minimum Mojang 165 cm dan Jajaka 170 cm dengan berat badan proporsional. Isi data tinggi & berat badan pada langkah Formulir & Persyaratan.'
  if (/akun|masuk|daftar|password|sandi/.test(q))
    return 'Gunakan halaman masuk atau pilih akses cepat Peserta / Panitia pada portal demo. Pada mode prototipe frontend ini verifikasi login dilewati dan seluruh data berjalan secara lokal di browser.'
  return 'Informasi tersebut belum tersedia dalam ketentuan yang saya miliki. Silakan konfirmasikan kepada panitia. Saya dapat membantu tentang persyaratan, berat/tinggi badan, template CV, unggahan dokumen, dan jadwal interview.'
}

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: 'assistant', content: welcome },
  ])
  const [query, setQuery] = useState('')
  const bottom = useRef<HTMLDivElement>(null)
  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages])
  const send = (value: string) => {
    if (!value.trim()) return
    setMessages((previous) => [
      ...previous,
      { role: 'user', content: value.trim() },
      { role: 'assistant', content: answer(value) },
    ])
    setQuery('')
  }
  return (
    <div className="assistant-container fixed bottom-6 right-6 z-40">
      {open && (
        <section
          role="dialog"
          aria-label="Percakapan MOKA Assistant"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false)
          }}
          className="assistant-panel mb-4 flex h-[min(580px,75dvh)] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-line bg-paper shadow-xl"
        >
          <header className="flex items-center gap-3 bg-cocoa p-5 text-champagne">
            <span className="flex size-10 items-center justify-center rounded-xl border border-gold/30 bg-gold/10 text-gold">
              <MessageCircle size={21} />
            </span>
            <div className="flex-1">
              <Text className="text-sm font-semibold">MOKA Assistant</Text>
              <Text className="mt-1 text-[10px] text-champagne/80">
                Panduan pendaftaran, selangkah lebih mudah
              </Text>
            </div>
            <Button
              variant="ghost"
              className="!min-h-8 !p-1 !text-champagne"
              aria-label="Tutup Assistant"
              onClick={() => setOpen(false)}
            >
              <X size={19} />
            </Button>
          </header>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((message, i) => (
              <div
                key={i}
                className={`max-w-[94%] rounded-xl p-3.5 text-xs leading-6 ${message.role === 'user' ? 'ml-auto rounded-br-sm bg-brand text-ivory' : 'rounded-tl-sm bg-canvas text-ink'}`}
              >
                {message.content}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="space-y-2 pt-1">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="secondary"
                    className="!min-h-9 w-full !justify-start !px-3 !py-2 !text-left !text-xs !font-normal"
                    onClick={() => send(suggestion)}
                  >
                    {suggestion}
                    <MessageCircle size={13} className="ml-auto shrink-0 text-muted" />
                  </Button>
                ))}
              </div>
            )}
            <div ref={bottom} />
          </div>
          <div className="border-t border-line p-4">
            <form
              className="relative"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                send(query)
              }}
            >
              <Input
                aria-label="Tulis pertanyaan"
                placeholder="Tanyakan tentang pendaftaran…"
                value={query}
                maxLength={1000}
                onChange={(e) => setQuery(e.target.value)}
                className="!min-h-11 !pr-12 !text-xs"
              />
              <Button
                type="submit"
                className="absolute bottom-1.5 right-1.5 !size-8 !min-h-8 !rounded-md !p-0"
                aria-label="Kirim pertanyaan"
                disabled={!query.trim()}
              >
                <ArrowUp size={16} />
              </Button>
            </form>
            <Text className="mt-2.5 text-center text-[9px] leading-relaxed text-muted">
              Berdasarkan brief. Informasi resmi tetap mengikuti panitia.
            </Text>
          </div>
        </section>
      )}
      {!open && (
        <Button
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          className="assistant-trigger ml-auto flex !min-h-14 !gap-3 !rounded-full !border-gold/30 !bg-cocoa !px-5 !text-champagne shadow-lg hover:!bg-umber"
        >
          <MessageCircle size={19} className="text-gold-light" />
          <span className="text-xs font-medium">MOKA Assistant</span>
          <span className="ml-1 border-l border-champagne/20 pl-3 text-champagne/80">
            <ChevronDown size={16} />
          </span>
        </Button>
      )}
    </div>
  )
}
