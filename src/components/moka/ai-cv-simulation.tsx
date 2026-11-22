import { FileText } from 'lucide-react'
import { Alert, Badge, Button, Panel, Text } from './ui'

const criteria = [
  { name: 'Pengalaman organisasi dan kepanitiaan', score: 82, weight: 25 },
  { name: 'Kepemimpinan dan tanggung jawab', score: 76, weight: 20 },
  { name: 'Prestasi dan pencapaian', score: 80, weight: 20 },
  { name: 'Kegiatan sosial, budaya, atau pariwisata', score: 72, weight: 20 },
  { name: 'Kejelasan dan relevansi isi CV', score: 81, weight: 15 },
]
const weightedScore = criteria.reduce((sum, item) => sum + (item.score * item.weight) / 100, 0)

export default function AICVSimulation({
  hasCV,
  onViewCV,
}: {
  hasCV: boolean
  onViewCV: () => void
}) {
  return (
    <>
      <Panel>
        <div className="mb-4 flex items-center gap-3">
          <FileText size={21} className="text-brand" />
          <Text as="h2" className="font-serif text-xl">
            Ringkasan CV
          </Text>
          <Badge>Contoh dummy</Badge>
        </div>
        <Alert className="mb-5 !text-xs">
          AI belum terintegrasi. Konten berikut merupakan contoh ilustratif untuk menunjukkan bentuk
          ringkasan CV yang direncanakan. Ringkasan dan skor yang ditampilkan belum dihasilkan oleh
          model AI dan tidak mewakili hasil analisis aktual peserta.
        </Alert>
        <Text className="text-sm leading-8 text-muted">
          Contoh dummy: seorang peserta ilustratif mencantumkan pengalaman organisasi mahasiswa,
          kepanitiaan kegiatan kampus, pelatihan pengembangan diri, serta pencapaian akademik dan
          nonakademik. Ringkasan contoh menata informasi tersebut agar reviewer lebih mudah
          menelusuri bukti pada CV. Pernyataan ini bukan temuan dari CV peserta yang sedang
          ditinjau.
        </Text>
        <Button variant="secondary" className="mt-5" disabled={!hasCV} onClick={onViewCV}>
          Tinjau CV asli
        </Button>
      </Panel>
      <Panel>
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Text as="h2" className="font-serif text-xl">
            Kesesuaian CV dengan Kriteria Panitia
          </Text>
          <Badge>Simulasi</Badge>
        </div>
        <Text className="text-xs leading-7 text-muted">
          Analisis AI nantinya mengacu pada kriteria dan bobot yang ditetapkan panitia. Kriteria
          berikut hanya contoh UI, bukan standar resmi.
        </Text>
        <div className="my-6 flex flex-wrap items-center gap-6">
          <div
            className="relative size-40 shrink-0"
            role="img"
            aria-label="Skor simulasi dummy 78 dari 100"
          >
            <svg viewBox="0 0 100 100" className="size-full -rotate-90" fill="none">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-line"
                stroke="currentColor"
                strokeWidth="7"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-brand"
                stroke="currentColor"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray={`${(2 * Math.PI * 42 * weightedScore) / 100} ${2 * Math.PI * 42}`}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Text className="font-serif text-4xl">{Math.round(weightedScore)}</Text>
              <Text className="text-xs text-muted">/100 · Dummy</Text>
            </div>
          </div>
          <div className="max-w-xs">
            <Text className="text-sm font-semibold">Skor berbobot contoh: 78,25/100</Text>
            <Text className="mt-2 text-xs leading-7 text-muted">
              Seluruh nilai merupakan simulasi prototipe. Tidak disimpan sebagai penilaian peserta
              dan tidak digunakan untuk peringkat atau keputusan kelulusan.
            </Text>
          </div>
        </div>
        <div className="divide-y divide-line">
          {criteria.map((item) => (
            <div key={item.name} className="flex items-center gap-3 py-3 text-xs">
              <Text className="flex-1 leading-6">{item.name}</Text>
              <span className="font-semibold text-brand">{item.score}/100</span>
              <span className="text-muted">Bobot {item.weight}%</span>
            </div>
          ))}
        </div>
        <Alert className="mt-5 !text-xs">
          Reviewer wajib memeriksa CV asli. AI tidak menetapkan kelulusan, menentukan pemenang, atau
          memberikan penilaian wawancara.
        </Alert>
      </Panel>
    </>
  )
}
