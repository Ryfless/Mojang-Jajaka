import { DEFAULT_THEME } from '@/lib/theme'
import type {
  Application,
  DocumentKind,
  Interview,
  MokaDocument,
  MokaStoreState,
  MokaUser,
  ParticipantScenario,
  ReviewHistory,
} from '@/types/moka'

export const COMMITTEE_USER_ID = 'user-panitia-1'
export const DEFAULT_PARTICIPANT_ID = 'user-mojang-1'

export const PARTICIPANT_SCENARIOS: ParticipantScenario[] = [
  {
    id: 'winner',
    userId: 'user-mojang-1',
    label: 'Siti Rahma Putri (Lolos & Buka Hasil)',
    shortLabel: 'Lolos / Buka Hasil',
    description:
      'Lolos administrasi dengan jadwal pembukaan hasil sudah tiba (uji hitung mundur 3-2-1 & jadwal interview).',
  },
  {
    id: 'pending',
    userId: 'user-mojang-2',
    label: 'Alya Nurhaliza (Menunggu Verifikasi)',
    shortLabel: 'Menunggu Verifikasi',
    description:
      'Seluruh 5 berkas wajib telah dikirim (read-only) dan menunggu keputusan akhir panitia.',
  },
  {
    id: 'rejected',
    userId: 'user-jajaka-5',
    label: 'Gilang Ramadhan (Tidak Lolos Administrasi)',
    shortLabel: 'Tidak Lolos Administrasi',
    description:
      'Keputusan tidak lolos administrasi dari panitia beserta catatan alasan yang dapat dibaca peserta.',
  },
  {
    id: 'draft',
    userId: 'user-jajaka-2',
    label: 'Bagas Mahendra (Draft Wizard 3 Langkah)',
    shortLabel: 'Draft / Wizard 3 Langkah',
    description:
      'Status draft belum terkirim; langsung membuka wizard 01 Formulir → 02 Upload Dokumen → 03 Pratinjau & Kirim.',
  },
]

const dayMs = 86_400_000

function isoOffset(daysFromNow: number, hour = 10, minute = 0): string {
  const target = new Date(Date.now() + daysFromNow * dayMs)
  target.setUTCHours(hour - 7, minute, 0, 0)
  return target.toISOString()
}

function makeDocSet(
  ownerId: string,
  category: 'Mojang' | 'Jajaka',
  createdAt: string,
  statuses: Partial<
    Record<DocumentKind, { status: 'uploaded' | 'received'; note?: string }>
  >,
  options?: { includeCertificate?: boolean; skipAll?: boolean },
): MokaDocument[] {
  if (options?.skipAll) return []

  const portraitUrl =
    category === 'Mojang'
      ? '/samples/pas-foto-mojang-dummy.svg'
      : '/samples/pas-foto-jajaka-dummy.svg'

  const baseDocs: Array<{
    kind: DocumentKind
    originalName: string
    mimeType: string
    filesize: number
    url: string
  }> = [
    {
      kind: 'portrait',
      originalName: `pas-foto-4x6-${ownerId}.svg`,
      mimeType: 'image/svg+xml',
      filesize: 2840,
      url: portraitUrl,
    },
    {
      kind: 'fullBody',
      originalName: `foto-full-body-4r-${ownerId}.svg`,
      mimeType: 'image/svg+xml',
      filesize: 3120,
      url: '/samples/foto-fullbody-dummy.svg',
    },
    {
      kind: 'closeUp',
      originalName: `foto-closeup-4r-${ownerId}.svg`,
      mimeType: 'image/svg+xml',
      filesize: 2960,
      url: '/samples/foto-closeup-dummy.svg',
    },
    {
      kind: 'identity',
      originalName: `ktp-kk-domisili-${ownerId}.pdf`,
      mimeType: 'application/pdf',
      filesize: 2187,
      url: '/templates/formulir-pendaftaran-dummy.pdf',
    },
    {
      kind: 'cv',
      originalName: `cv-${ownerId}.pdf`,
      mimeType: 'application/pdf',
      filesize: 2276,
      url: '/templates/template-cv-dummy.pdf',
    },
  ]

  if (options?.includeCertificate) {
    baseDocs.push({
      kind: 'certificate',
      originalName: `piagam-prestasi-${ownerId}.pdf`,
      mimeType: 'application/pdf',
      filesize: 2187,
      url: '/templates/formulir-pendaftaran-dummy.pdf',
    })
  }

  return baseDocs.map((item) => {
    const review = statuses[item.kind]
    const status = review?.status || 'uploaded'
    return {
      id: `doc-${ownerId}-${item.kind}`,
      owner: ownerId,
      kind: item.kind,
      originalName: item.originalName,
      filename: item.originalName,
      mimeType: item.mimeType,
      filesize: item.filesize,
      url: item.url,
      reviewStatus: status,
      reviewNote: review?.note || null,
      previousVersion: null,
      revisionNumber: 1,
      reviewedByName: status !== 'uploaded' ? 'Nadia Kusuma' : null,
      reviewedAt: status !== 'uploaded' ? createdAt : null,
      createdAt,
      updatedAt: createdAt,
    }
  })
}

export function createInitialMockState(): MokaStoreState {
  const t12 = isoOffset(-12, 9, 15)
  const t10 = isoOffset(-10, 14, 30)
  const t9 = isoOffset(-9, 11, 20)
  const t8 = isoOffset(-8, 16, 45)
  const t7 = isoOffset(-7, 10, 10)
  const t6 = isoOffset(-6, 13, 5)
  const t5 = isoOffset(-5, 15, 40)
  const t4 = isoOffset(-4, 9, 50)
  const t3 = isoOffset(-3, 14, 15)
  const t1 = isoOffset(-1, 11, 0)

  const users: MokaUser[] = [
    {
      id: COMMITTEE_USER_ID,
      name: 'Nadia Kusuma',
      email: 'panitia@moka-bogor.id',
      role: 'committee',
    },
    {
      id: 'user-mojang-1',
      name: 'Siti Rahma Putri',
      email: 'siti.rahma@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-jajaka-1',
      name: 'Raka Pratama Wijaya',
      email: 'raka.pratama@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-mojang-2',
      name: 'Alya Nurhaliza',
      email: 'alya.nurhaliza@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-jajaka-2',
      name: 'Bagas Mahendra',
      email: 'bagas.mahendra@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-jajaka-3',
      name: 'Dimas Fajar Nugroho',
      email: 'dimas.fajar@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-mojang-3',
      name: 'Nabila Azzahra',
      email: 'nabila.azzahra@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-jajaka-4',
      name: 'Fadlan Hakim',
      email: 'fadlan.hakim@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-mojang-4',
      name: 'Intan Permatasari',
      email: 'intan.permata@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-mojang-5',
      name: 'Salma Khairunnisa',
      email: 'salma.khairunnisa@contoh-moka.id',
      role: 'participant',
    },
    {
      id: 'user-jajaka-5',
      name: 'Gilang Ramadhan',
      email: 'gilang.ramadhan@contoh-moka.id',
      role: 'participant',
    },
  ]

  const applications: Application[] = [
    {
      id: 'app-moka-001',
      owner: 'user-mojang-1',
      fullName: 'Siti Rahma Putri',
      phone: '081234567801',
      category: 'Mojang',
      birthDate: '2003-04-18',
      height: 168,
      weight: 52,
      education: 'Mahasiswi S1 Ilmu Komunikasi',
      address: 'Jl. Tegar Beriman No. 24, Kelurahan Pakansari',
      district: 'Cibinong',
      eligibility: true,
      status: 'accepted',
      reviewNote: 'Seluruh dokumen lengkap dan memenuhi ketentuan administrasi.',
      winner: true,
      resultPublished: true,
      submittedAt: t12,
      requirementsConfirmed: true,
      decidedByName: 'Nadia Kusuma',
      decidedAt: t10,
      createdAt: t12,
      updatedAt: t10,
    },
    {
      id: 'app-moka-002',
      owner: 'user-jajaka-1',
      fullName: 'Raka Pratama Wijaya',
      phone: '081234567802',
      category: 'Jajaka',
      birthDate: '2002-09-11',
      height: 175,
      weight: 68,
      education: 'Mahasiswa S1 Agribisnis',
      address: 'Jl. Raya Dramaga KM 7 No. 14',
      district: 'Dramaga',
      eligibility: true,
      status: 'pending',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: t10,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: t10,
      updatedAt: t8,
    },
    {
      id: 'app-moka-003',
      owner: 'user-mojang-2',
      fullName: 'Alya Nurhaliza',
      phone: '081234567803',
      category: 'Mojang',
      birthDate: '2004-01-27',
      height: 167,
      weight: 50,
      education: 'Mahasiswi S1 Pariwisata',
      address: 'Jl. Mayor Oking Jaya Atmaja No. 88',
      district: 'Citeureup',
      eligibility: true,
      status: 'pending',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: t6,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: t7,
      updatedAt: t6,
    },
    {
      id: 'app-moka-004',
      owner: 'user-jajaka-2',
      fullName: 'Bagas Mahendra',
      phone: '081234567804',
      category: 'Jajaka',
      birthDate: '2003-11-05',
      height: 173,
      weight: 66,
      education: 'Mahasiswa S1 Manajemen',
      address: 'Jl. Raya Puncak KM 12, Desa Bendungan',
      district: 'Ciawi',
      eligibility: true,
      status: 'draft',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: null,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: t3,
      updatedAt: t1,
    },
    {
      id: 'app-moka-005',
      owner: 'user-jajaka-3',
      fullName: 'Dimas Fajar Nugroho',
      phone: '081234567805',
      category: 'Jajaka',
      birthDate: '2001-07-22',
      height: 177,
      weight: 71,
      education: 'Wiraswasta & Penggiat Seni Budaya',
      address: 'Perumahan Griya Asri Blok C2 No. 9',
      district: 'Gunung Putri',
      eligibility: true,
      status: 'accepted',
      reviewNote: 'Berkas lengkap, profil budaya daerah sangat baik.',
      winner: true,
      resultPublished: true,
      submittedAt: t12,
      requirementsConfirmed: true,
      decidedByName: 'Nadia Kusuma',
      decidedAt: t9,
      createdAt: t12,
      updatedAt: t9,
    },
    {
      id: 'app-moka-006',
      owner: 'user-mojang-3',
      fullName: 'Nabila Azzahra',
      phone: '081234567806',
      category: 'Mojang',
      birthDate: '2003-02-14',
      height: 169,
      weight: 53,
      education: 'Mahasiswi S1 Sastra Sunda',
      address: 'Jl. MH. Thamrin Sentul Selatan No. 31',
      district: 'Babakan Madang',
      eligibility: true,
      status: 'accepted',
      reviewNote: 'Persyaratan dan berkas memenuhi ketentuan.',
      winner: false,
      resultPublished: false,
      submittedAt: t9,
      requirementsConfirmed: true,
      decidedByName: 'Nadia Kusuma',
      decidedAt: t7,
      createdAt: t9,
      updatedAt: t7,
    },
    {
      id: 'app-moka-007',
      owner: 'user-jajaka-4',
      fullName: 'Fadlan Hakim',
      phone: '081234567807',
      category: 'Jajaka',
      birthDate: '2002-12-03',
      height: 174,
      weight: 65,
      education: 'Mahasiswa S1 Teknik Informatika',
      address: 'Jl. Raya Bojonggede No. 45',
      district: 'Bojonggede',
      eligibility: true,
      status: 'pending',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: t5,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: t5,
      updatedAt: t4,
    },
    {
      id: 'app-moka-008',
      owner: 'user-mojang-4',
      fullName: 'Intan Permatasari',
      phone: '081234567808',
      category: 'Mojang',
      birthDate: '2005-06-19',
      height: 166,
      weight: 49,
      education: 'Mahasiswi D4 Usaha Perjalanan Wisata',
      address: 'Jl. Raya Parung No. 19',
      district: 'Parung',
      eligibility: true,
      status: 'pending',
      reviewNote: null,
      winner: false,
      resultPublished: false,
      submittedAt: t4,
      requirementsConfirmed: false,
      decidedByName: null,
      decidedAt: null,
      createdAt: t4,
      updatedAt: t4,
    },
    {
      id: 'app-moka-009',
      owner: 'user-mojang-5',
      fullName: 'Salma Khairunnisa',
      phone: '081234567809',
      category: 'Mojang',
      birthDate: '2003-08-30',
      height: 166,
      weight: 51,
      education: 'Mahasiswi S1 Pendidikan Bahasa Inggris',
      address: 'Jl. Raya Kemang No. 72',
      district: 'Kemang',
      eligibility: true,
      status: 'rejected',
      reviewNote: 'Pas foto 4×6 belum menggunakan latar belakang putih polos sesuai ketentuan.',
      winner: false,
      resultPublished: false,
      submittedAt: t8,
      requirementsConfirmed: false,
      decidedByName: 'Nadia Kusuma',
      decidedAt: t5,
      createdAt: t8,
      updatedAt: t5,
    },
    {
      id: 'app-moka-010',
      owner: 'user-jajaka-5',
      fullName: 'Gilang Ramadhan',
      phone: '081234567810',
      category: 'Jajaka',
      birthDate: '2001-03-08',
      height: 167,
      weight: 63,
      education: 'Wiraswasta',
      address: 'Jl. Alternatif Cibubur – Cileungsi No. 102',
      district: 'Cileungsi',
      eligibility: true,
      status: 'rejected',
      reviewNote:
        'Tinggi badan belum memenuhi batas minimum kategori Jajaka (170 cm) sesuai ketentuan administrasi.',
      winner: false,
      resultPublished: false,
      submittedAt: t10,
      requirementsConfirmed: false,
      decidedByName: 'Nadia Kusuma',
      decidedAt: t7,
      createdAt: t10,
      updatedAt: t7,
    },
  ]

  const documents: MokaDocument[] = [
    ...makeDocSet(
      'user-mojang-1',
      'Mojang',
      t10,
      {
        portrait: { status: 'received' },
        fullBody: { status: 'received' },
        closeUp: { status: 'received' },
        identity: { status: 'received' },
        cv: { status: 'received' },
        certificate: { status: 'received' },
      },
      { includeCertificate: true },
    ),
    ...makeDocSet('user-jajaka-1', 'Jajaka', t8, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'received' },
      cv: { status: 'uploaded' },
    }),
    ...makeDocSet('user-mojang-2', 'Mojang', t6, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'uploaded' },
      cv: { status: 'uploaded' },
    }),
    // user-jajaka-2 is draft with 0 uploaded docs so onboarding wizard starts fresh
    ...makeDocSet(
      'user-jajaka-3',
      'Jajaka',
      t9,
      {
        portrait: { status: 'received' },
        fullBody: { status: 'received' },
        closeUp: { status: 'received' },
        identity: { status: 'received' },
        cv: { status: 'received' },
        certificate: { status: 'received' },
      },
      { includeCertificate: true },
    ),
    ...makeDocSet('user-mojang-3', 'Mojang', t7, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'received' },
      cv: { status: 'received' },
    }),
    ...makeDocSet('user-jajaka-4', 'Jajaka', t4, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'received' },
      cv: { status: 'received' },
    }),
    ...makeDocSet('user-mojang-4', 'Mojang', t4, {
      portrait: { status: 'uploaded' },
      fullBody: { status: 'uploaded' },
      closeUp: { status: 'uploaded' },
      identity: { status: 'uploaded' },
      cv: { status: 'uploaded' },
    }),
    ...makeDocSet('user-mojang-5', 'Mojang', t5, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'received' },
      cv: { status: 'received' },
    }),
    ...makeDocSet('user-jajaka-5', 'Jajaka', t7, {
      portrait: { status: 'received' },
      fullBody: { status: 'received' },
      closeUp: { status: 'received' },
      identity: { status: 'received' },
      cv: { status: 'received' },
    }),
  ]

  const interviews: Interview[] = [
    {
      id: 'int-001',
      date: isoOffset(5, 10, 0),
      location: 'Ruang Rapat Dinas Kebudayaan & Pariwisata Kabupaten Bogor, Cibinong',
      link: 'https://meet.google.com/moka-bogor-dummy',
      note: 'Hadir 20 menit lebih awal dengan mengenakan busana semi-formal bernuansa batik Bogor. Bawa dua lembar pas foto cetak 4×6 sesuai ketentuan map merah.',
      status: 'published',
      createdAt: t3,
      updatedAt: t3,
    },
    {
      id: 'int-002',
      date: isoOffset(6, 13, 30),
      location: 'Ruang Rapat Dinas Kebudayaan & Pariwisata Kabupaten Bogor, Cibinong',
      link: '',
      note: 'Draft jadwal interview gelombang 2 untuk peserta lolos administrasi.',
      status: 'draft',
      createdAt: t1,
      updatedAt: t1,
    },
  ]

  const reviewHistory: ReviewHistory[] = [
    {
      id: 'rev-001',
      owner: 'user-mojang-1',
      action: 'document-review',
      document: 'doc-user-mojang-1-cv',
      documentKind: 'cv',
      revisionNumber: 1,
      result: 'received',
      note: 'Dokumen CV telah ditinjau oleh panitia.',
      filename: 'cv-user-mojang-1.pdf',
      actorName: 'Nadia Kusuma',
      recordedAt: t10,
      createdAt: t10,
      updatedAt: t10,
    },
    {
      id: 'rev-002',
      owner: 'user-mojang-1',
      action: 'administrative-decision',
      application: 'app-moka-001',
      result: 'accepted',
      note: 'Seluruh dokumen lengkap dan memenuhi ketentuan administrasi.',
      actorName: 'Nadia Kusuma',
      recordedAt: t10,
      createdAt: t10,
      updatedAt: t10,
    },
    {
      id: 'rev-003',
      owner: 'user-jajaka-1',
      action: 'document-upload',
      document: 'doc-user-jajaka-1-cv',
      documentKind: 'cv',
      revisionNumber: 1,
      result: 'uploaded',
      filename: 'cv-user-jajaka-1.pdf',
      actorName: 'Raka Pratama Wijaya',
      recordedAt: t10,
      createdAt: t10,
      updatedAt: t10,
    },
    {
      id: 'rev-005',
      owner: 'user-mojang-5',
      action: 'administrative-decision',
      application: 'app-moka-009',
      result: 'rejected',
      note: 'Pas foto 4×6 belum menggunakan latar belakang putih polos sesuai ketentuan.',
      actorName: 'Nadia Kusuma',
      recordedAt: t5,
      createdAt: t5,
      updatedAt: t5,
    },
    {
      id: 'rev-006',
      owner: 'user-jajaka-5',
      action: 'administrative-decision',
      application: 'app-moka-010',
      result: 'rejected',
      note: 'Tinggi badan belum memenuhi batas minimum kategori Jajaka (170 cm) sesuai ketentuan administrasi.',
      actorName: 'Nadia Kusuma',
      recordedAt: t7,
      createdAt: t7,
      updatedAt: t7,
    },
  ]

  return {
    users,
    activeParticipantId: DEFAULT_PARTICIPANT_ID,
    activeRole: 'participant',
    applications,
    documents,
    interviews,
    profilePhotos: [],
    reviewHistory,
    settings: {
      id: 'moka-settings-1',
      registrationNote:
        'Mode simulasi frontend aktif dengan data dummy lokal (tanpa backend/database).',
      parentPermissionTemplate: '/templates/surat-izin-orang-tua-dummy.pdf',
      registrationFormTemplate: '/templates/formulir-pendaftaran-dummy.pdf',
      cvTemplate: '/templates/template-cv-dummy.pdf',
      registrationDeadline: isoOffset(14, 23, 59),
      selectionReleaseAt: isoOffset(-1, 9, 0),
      uploadNote:
        'Pastikan seluruh berkas sudah final sebelum dikirim. Setelah pendaftaran dikirim, dokumen hanya dapat ditinjau.',
      physicalNote: 'Penyerahan berkas fisik mengikuti arahan resmi panitia MOKA Kabupaten Bogor.',
      eventYear: DEFAULT_THEME.eventYear,
      theme: { ...DEFAULT_THEME },
      updatedAt: t1,
    },
  }
}
