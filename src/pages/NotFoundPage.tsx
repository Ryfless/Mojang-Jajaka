import { Link } from 'react-router-dom'
import { Text, Wordmark } from '@/components/moka/ui'

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-8 py-16 text-center">
      <Wordmark compact />
      <Text as="h1" className="mt-8 font-serif text-3xl font-semibold tracking-tight text-cocoa">
        Halaman Tidak Ditemukan
      </Text>
      <Text className="mt-4 text-sm leading-7 text-muted">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </Text>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm font-medium">
        <Link className="text-brand underline-offset-4 hover:underline" to="/">
          &larr; Kembali ke Beranda
        </Link>
        <Link className="text-brand underline-offset-4 hover:underline" to="/peserta">
          Ruang Peserta
        </Link>
        <Link className="text-brand underline-offset-4 hover:underline" to="/panitia">
          Ruang Panitia
        </Link>
      </div>
    </main>
  )
}
