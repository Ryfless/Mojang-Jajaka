export const cvTemplateDummyURL = '/templates/template-cv-dummy.pdf'

export const documentTypes = [
  {
    key: 'parentPermission',
    name: 'Surat izin orang tua',
    description: 'Unduh dokumen contoh untuk referensi. Tidak perlu diunggah kembali.',
    template: true,
    dummyURL: '/templates/surat-izin-orang-tua-dummy.pdf',
    required: false,
  },
  {
    key: 'registrationForm',
    name: 'Formulir pendaftaran',
    description: 'Unduh dokumen contoh untuk referensi. Tidak perlu diunggah kembali.',
    template: true,
    dummyURL: '/templates/formulir-pendaftaran-dummy.pdf',
    required: false,
  },
  {
    key: 'portrait',
    name: 'Pas foto 4 × 6',
    description: 'Pas foto dengan latar putih.',
    required: true,
  },
  {
    key: 'fullBody',
    name: 'Foto full body 4R',
    description: 'Foto seluruh badan dengan latar putih.',
    required: true,
  },
  {
    key: 'closeUp',
    name: 'Foto close-up 4R',
    description: 'Foto close-up dengan latar putih.',
    required: true,
  },
  {
    key: 'identity',
    name: 'KTP / KK / surat domisili',
    description: 'Bukti domisili di Kabupaten Bogor.',
    required: true,
  },
  {
    key: 'cv',
    name: 'Curriculum Vitae (CV)',
    description:
      'Unduh template CV terlebih dahulu bila belum memiliki format, isi riwayat diri, lalu unggah kembali.',
    templateDummyURL: cvTemplateDummyURL,
    required: true,
  },
  {
    key: 'certificate',
    name: 'Piagam / sertifikat prestasi',
    description: 'Prestasi akademik maupun nonakademik.',
    required: false,
  },
] as const

// Template types are download-only; only these document types accept uploads.
export const uploadDocumentTypes = documentTypes.filter((type) => !('template' in type))
export const downloadTemplateTypes = documentTypes.filter((type) => 'template' in type)
export const requiredDocumentCount = uploadDocumentTypes.filter((type) => type.required).length

export function templateURL(configured: string | null | undefined, fallback: string) {
  return configured && (/^https?:\/\//.test(configured) || /^\/(?!\/)/.test(configured))
    ? configured
    : fallback
}

export const requirements = [
  'Berdomisili di Kabupaten Bogor, dibuktikan dengan KTP, KK, atau surat domisili.',
  'Berusia 17–24 tahun dan belum menikah.',
  'Pendidikan minimal pelajar / mahasiswa aktif perguruan tinggi / wiraswasta, sesuai redaksi pamflet.',
  'Mampu berbahasa Indonesia dan bahasa daerah; bahasa Inggris menjadi nilai tambah.',
  'Tinggi badan minimum Mojang 165 cm dan Jajaka 170 cm dengan berat badan proporsional.',
  'Tidak menggunakan narkoba atau obat-obatan terlarang.',
  'Berkelakuan baik, berwawasan luas, dan berbakat.',
  'Mengetahui potensi wisata daerah asal.',
  'Siap dan bertanggung jawab mengemban tugas selama masa menjabat.',
]

export const statusLabels: Record<string, string> = {
  draft: 'Draft',
  pending: 'Menunggu verifikasi',
  accepted: 'Lolos administrasi',
  rejected: 'Tidak lolos',
  uploaded: 'Belum diperiksa',
  received: 'Sudah diperiksa',
}

export const documentStatusLabels: Record<string, string> = {
  uploaded: 'Belum diperiksa',
  received: 'Sudah diperiksa',
}

export type Profile = {
  fullName: string
  phone: string
  category: string
  birthDate: string
  height: string
  weight: string
  education: string
  address: string
  district: string
  eligibility: boolean
}

export const emptyProfile: Profile = {
  fullName: '',
  phone: '',
  category: '',
  birthDate: '',
  height: '',
  weight: '',
  education: '',
  address: '',
  district: '',
  eligibility: false,
}
